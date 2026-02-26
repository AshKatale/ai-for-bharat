import Card from './Card';

function ChartCard({ title, children }) {
  return (
    <Card title={title} className="h-full">
      <div className="h-72 w-full">{children}</div>
    </Card>
  );
}

export default ChartCard;
