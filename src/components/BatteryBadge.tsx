type BatteryBadgeProps = {
  battery: number;
};

function BatteryBadge({ battery }: BatteryBadgeProps) {
  if (battery < 20) {
    return (
      <div className="d-flex flex-column gap-1">
        <span>{battery}%</span>
        <span className="badge text-bg-danger">Baixa</span>
      </div>
    );
  }

  return <span>{battery}%</span>;
}

export default BatteryBadge;
