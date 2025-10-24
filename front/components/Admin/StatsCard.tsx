type Props = {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
};

const StatsCard: React.FC<Props> = ({ title, value, icon, color = "blue", trend }) => {
  const colorClasses = {
    blue: "bg-blue",
    green: "bg-green",
    yellow: "bg-yellow",
    red: "bg-red",
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray400 text-sm font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-gray500">{value}</h3>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? "text-green" : "text-red"}`}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div
          className={`${colorClasses[color as keyof typeof colorClasses]} bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center`}
        >
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
