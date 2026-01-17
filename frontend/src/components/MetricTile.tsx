interface MetricTileProps {
    title: string;
    value: string;
    subtitle: string;
    isPositive?: boolean | null;
    className?: string;
}

export default function MetricTile({ title, value, subtitle, isPositive, className = '' }: MetricTileProps) {
    const isWhiteBackground = className.includes('bg-white');

    return (
        <div className={`rounded-2xl p-6 shadow-lg transition-transform hover:scale-105 ${className}`}>
            <p className={`text-sm font-medium ${isWhiteBackground ? 'text-gray-500' : 'text-white/80'}`}>
                {title}
            </p>
            <p className={`text-3xl font-bold mt-2 ${isWhiteBackground
                    ? isPositive === true
                        ? 'text-green-600'
                        : isPositive === false
                            ? 'text-red-600'
                            : 'text-gray-800'
                    : 'text-white'
                }`}>
                {value}
            </p>
            <p className={`text-sm mt-1 ${isWhiteBackground ? 'text-gray-400' : 'text-white/60'}`}>
                {subtitle}
            </p>
        </div>
    );
}
