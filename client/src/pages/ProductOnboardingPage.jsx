import { useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';

const initialForm = {
  productName: '',
  category: '',
  description: '',
  targetAudience: '',
  competitors: '',
  websiteUrl: ''
};

function ProductOnboardingPage() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    localStorage.setItem('onboarding_data', JSON.stringify(form));
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-2xl font-semibold text-white">Product Onboarding</h2>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="productName"
            placeholder="Product Name"
            className="input"
            value={form.productName}
            onChange={handleChange}
            required
          />
          <input name="category" placeholder="Category" className="input" value={form.category} onChange={handleChange} required />
          <textarea
            name="description"
            placeholder="Description"
            className="input min-h-24"
            value={form.description}
            onChange={handleChange}
            required
          />
          <input
            name="targetAudience"
            placeholder="Target Audience"
            className="input"
            value={form.targetAudience}
            onChange={handleChange}
            required
          />
          <input
            name="competitors"
            placeholder="Competitors"
            className="input"
            value={form.competitors}
            onChange={handleChange}
          />
          <input
            name="websiteUrl"
            type="url"
            placeholder="Website URL"
            className="input"
            value={form.websiteUrl}
            onChange={handleChange}
            required
          />
          <Button type="submit">Submit</Button>
        </form>
      </Card>

      {submitted ? (
        <Card>
          <p className="text-emerald-300">Product details submitted. AI analysis pipeline queued.</p>
        </Card>
      ) : null}
    </div>
  );
}

export default ProductOnboardingPage;
