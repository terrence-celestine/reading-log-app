interface Props {
    current: number;
    total: number;
  }
  
  export const ProgressBar = ({ current, total }: Props) => {
    // Prevent division by zero and cap at 100%
    const percentage = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  // Define color: green if complete, blue otherwise
  const isComplete = current >= total && total > 0;
  const barColor = isComplete ? 'bg-emerald-500' : 'bg-blue-600';

    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div 
          className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };