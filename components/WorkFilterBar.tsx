"use client";

type WorkFilterBarProps = {
  workDate: string;
  shift: string;
  loading: boolean;
  findLabel: string;
  onWorkDateChange: (value: string) => void;
  onShiftChange: (value: string) => void;
  onFind: () => void;
};

export function WorkFilterBar({
  workDate,
  shift,
  loading,
  findLabel,
  onWorkDateChange,
  onShiftChange,
  onFind
}: WorkFilterBarProps) {
  return (
    <>
      <div className="row">
        <div className="col-6">
          <label className="mb-3 text-secondary">Work Date</label>
          <input className="form-control mb-3" type="date" value={workDate} onChange={(e) => onWorkDateChange(e.target.value)} />
        </div>
        <div className="col-6">
          <label className="mb-3 text-secondary">Shift</label>
          <select className="form-control" value={shift} onChange={(e) => onShiftChange(e.target.value)}>
            <option value="night">Night</option>
            <option value="day">Day</option>
          </select>
        </div>
      </div>
      <div className="d-flex">
        <button type="button" className="btn btn-warning ms-auto mb-3" onClick={onFind} disabled={loading}>
          {findLabel}
        </button>
      </div>
    </>
  );
}
