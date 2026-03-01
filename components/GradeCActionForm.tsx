"use client";

import type { ReactNode } from "react";

type ReasonOption = {
  Reason_Code: string;
  Reason_Name: string;
};

type GroupOption = {
  id: string | number;
  sub_proces: string;
};

type GradeCActionFormProps = {
  reasonC: string;
  groupMc: string;
  cqty: string;
  reasons: ReasonOption[];
  groups: GroupOption[];
  loading: boolean;
  onReasonChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  onCqtyChange: (value: string) => void;
  onConfirm: () => void;
  extraField?: ReactNode;
  reasonWidth?: number;
  groupWidth?: number;
};

export function GradeCActionForm({
  reasonC,
  groupMc,
  cqty,
  reasons,
  groups,
  loading,
  onReasonChange,
  onGroupChange,
  onCqtyChange,
  onConfirm,
  extraField,
  reasonWidth = 200,
  groupWidth = 200
}: GradeCActionFormProps) {
  return (
    <>
      <div className="col-12">
        <div className="d-flex">
          <select className="form-control" style={{ width: reasonWidth }} value={reasonC} onChange={(e) => onReasonChange(e.target.value)}>
            <option value="">Select reason Grade C</option>
            {reasons.map((reason) => (
              <option key={reason.Reason_Code} value={reason.Reason_Code}>
                {reason.Reason_Name}
              </option>
            ))}
          </select>
          <select className="form-control ms-3" style={{ width: groupWidth }} value={groupMc} onChange={(e) => onGroupChange(e.target.value)}>
            <option value="">Select Group Machine</option>
            {groups.map((group) => (
              <option key={group.id} value={group.sub_proces}>
                {group.sub_proces}
              </option>
            ))}
          </select>
          <input id="cqty" className="ms-3" type="number" value={cqty} onChange={(e) => onCqtyChange(e.target.value)} />
          <label className="form-label">pcs</label>
          {extraField}
        </div>
      </div>
      <div className="col-12 col-xl-6 px-3 pb-3">
        <div className="d-flex align-items-center">
          <button type="button" className="btn btn-success" onClick={onConfirm} disabled={loading}>
            Confirm Grade C
          </button>
        </div>
      </div>
    </>
  );
}
