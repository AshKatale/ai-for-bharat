import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

function ProductDashboardPage() {
  const { productId } = useParams();
  const productLabel = productId?.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ') || 'Product';

  return (
    <div className="min-h-screen flex flex-col landing-grid">
      <Navbar />
      <section className="pt-36 pb-20 px-4 max-w-4xl mx-auto w-full">
        <div className="glass-card p-8 md:p-10 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-3">Product Dashboard</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{productLabel}</h1>
          <p className="text-slate-400 mb-8">
            This is an empty dashboard placeholder. Product-specific details will be added here later.
          </p>
          <Link to="/" className="inline-flex">
            <button className="btn-outline px-6 py-3">Back to Landing Page</button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ProductDashboardPage;
