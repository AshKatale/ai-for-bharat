// LinkedIn Controller
const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const LINKEDIN_CLIENT_ID = '78dywljuedqnkx';
const LINKEDIN_CLIENT_SECRET = 'WPL_AP1.mtMHmgk9ThS40SrU.nuVqjQ==';
const REDIRECT_URI = 'https://api.geonix.live/auth/linkedin/callback';
const FRONTEND_REDIRECT_SUCCESS = 'https://www.geonix.live/dashboard/post-generator?linkedin_connected=true';

// Secure cookie options
const cookieOptionsSession = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60 * 1000 // 10 minutes for OAuth state
};

/**
 * Endpoint 1: Generates OAuth URL, sets state, redirects.
 * GET /auth/linkedin
 */
const getAuthUrl = (req, res) => {
    const state = crypto.randomUUID();
    
    // Store state in a cookie to validate it later in the callback
    res.cookie('linkedin_oauth_state', state, cookieOptionsSession);

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=openid%20profile%20email%20w_member_social`;
    
    res.redirect(authUrl);
};

/**
 * Endpoint 2: Validates state, exchanges code for token, fetches URN, stores in session, redirects.
 * GET /auth/linkedin/callback
 */
const authCallback = async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;

        // Check if user denied the request
        if (error) {
            logger.error(`LinkedIn Auth Error: ${error} - ${error_description}`);
            return res.redirect('https://www.geonix.live/dashboard/post-generator?linkedin_connected=false&error=access_denied');
        }

        // Validate state
        const storedState = req.cookies.linkedin_oauth_state;
        res.clearCookie('linkedin_oauth_state'); // Clear it immediately

        if (!state || state !== storedState) {
            return res.status(401).send('Invalid state parameter');
        }

        // Exchange code for token
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            client_id: LINKEDIN_CLIENT_ID,
            client_secret: LINKEDIN_CLIENT_SECRET
        });

        const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', tokenParams, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, expires_in } = tokenResponse.data;

        // Fetch User Info
        const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const userInfo = userInfoResponse.data;
        const personUrn = `urn:li:person:${userInfo.sub}`;

        // Store session in cookie
        const expirationTime = Date.now() + (expires_in * 1000);
        
        const sessionData = {
            linkedin_access_token: access_token,
            linkedin_person_urn: personUrn,
            linkedin_name: userInfo.name,
            linkedin_expires_at: expirationTime
        };

        const cookieOptionsAuth = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/', // Ensure cookie is sent on all requests
            maxAge: expires_in * 1000
        };

        // Saving session as a single JSON cookie
        res.cookie('linkedin_session', JSON.stringify(sessionData), cookieOptionsAuth);

        res.redirect(FRONTEND_REDIRECT_SUCCESS);

    } catch (err) {
        logger.error(`LinkedIn Callback Error: ${err.message}`);
        if (err.response) {
            logger.error(JSON.stringify(err.response.data));
        }
        res.status(500).send('Internal Server Error during LinkedIn Authentication');
    }
};

/**
 * Endpoint 3: Check LinkedIn Status based on session cookie.
 * GET /auth/linkedin/status
 */
const getAuthStatus = (req, res) => {
    try {
        const sessionCookie = req.cookies.linkedin_session;
        if (!sessionCookie) {
            return res.json({ connected: false });
        }

        const session = JSON.parse(sessionCookie);

        // Check token expiration
        if (Date.now() > session.linkedin_expires_at) {
            res.clearCookie('linkedin_session');
            return res.json({ connected: false });
        }

        return res.json({
            connected: true,
            name: session.linkedin_name
        });

    } catch (err) {
        logger.error(`Get Auth Status Error: ${err.message}`);
        return res.json({ connected: false });
    }
};

/**
 * Endpoint 4: Publish post to LinkedIn using the stored token
 * POST /linkedin/post
 */
const publishPost = async (req, res) => {
    try {
        const { post_text } = req.body;

        if (!post_text) {
            return sendError(res, 400, 'Missing post_text');
        }

        // Token read from session
        const sessionCookie = req.cookies.linkedin_session;
        if (!sessionCookie) {
            return res.status(401).json({ error: 'not_authenticated', message: 'LinkedIn not connected' });
        }

        const session = JSON.parse(sessionCookie);

        // Check token expiration
        if (Date.now() > session.linkedin_expires_at) {
            res.clearCookie('linkedin_session');
            return res.status(401).json({ error: 'token_expired', message: 'LinkedIn session expired' });
        }

        const { linkedin_access_token, linkedin_person_urn } = session;

        // Force trim to 3000 max just in case
        let finalPostText = post_text;
        if (finalPostText.length > 3000) {
            finalPostText = finalPostText.substring(0, 2997) + "...";
        }

        // Publish to LinkedIn
        const postData = {
            author: linkedin_person_urn,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                        text: finalPostText
                    },
                    shareMediaCategory: "NONE"
                }
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        };

        const linkedinResponse = await axios.post('https://api.linkedin.com/v2/ugcPosts', postData, {
            headers: {
                'Authorization': `Bearer ${linkedin_access_token}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
                'LinkedIn-Version': '202505'
            }
        });

        // 201 Created
        const postUrn = linkedinResponse.headers['x-restli-id'];
        
        return res.status(200).json({
            success: true,
            post_urn: postUrn,
            post_url: `https://www.linkedin.com/feed/update/${postUrn}`
        });

    } catch (err) {
        if (err.response) {
            const status = err.response.status;
            const data = err.response.data;
            logger.error(`LinkedIn Post Error [${status}]: ${JSON.stringify(data)}`);
            
            if (status === 401) {
                res.clearCookie('linkedin_session');
                return res.status(401).json({ error: 'token_expired', message: 'LinkedIn token expired. Please reconnect.' });
            }
            if (status === 403) {
                return res.status(403).json({ error: 'permission_denied', message: 'w_member_social scope missing. Please reconnect.' });
            }
        }
        
        logger.error(`Publish Post Error: ${err.message}`);
        // ensure correct error response behavior; user script gave sendError but sendError might have signature (res, code, msg, err)
        // using standard json
        return res.status(500).json({ success: false, message: `Internal server error: ${err.message}` });
    }
};

module.exports = {
    getAuthUrl,
    authCallback,
    getAuthStatus,
    publishPost
};