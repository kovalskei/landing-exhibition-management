import { Hall } from '@/utils/googleSheetsParser';

interface MobileHallFilterProps {
  halls: Hall[];
  selectedHall: string;
  onHallSelect: (hallId: string) => void;
}

export default function MobileHallFilter({ halls, selectedHall, onHallSelect }: MobileHallFilterProps) {
  return (
    <div className="hall-filter">
      <button
        className={selectedHall === 'all' ? 'hall-chip active' : 'hall-chip'}
        onClick={() => onHallSelect('all')}
      >
        Все залы
      </button>
      {halls.map(hall => (
        <button
          key={hall.id}
          className={selectedHall === hall.id ? 'hall-chip active' : 'hall-chip'}
          onClick={() => onHallSelect(hall.id)}
        >
          {hall.name}
        </button>
      ))}
    </div>
  );
}
