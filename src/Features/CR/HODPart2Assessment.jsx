import React from "react";

export default function HODPart2Assessment({ data, onChange, readOnly }) {
  return (
    <div className="space-y-4 border p-4 rounded-md mt-8">
      <h3 className="text-xl font-bold mb-4 text-[#145DA0]">
        Part II: Potential Assessment
      </h3>

      {/* Section A */}
      <div className="space-y-2">
        <h4 className="font-bold underline">A. Personality Traits</h4>

        <div>
          <label className="font-semibold">
            (i) Physical Capacity and general demeanour
          </label>
          <input
            type="text"
            name="physicalCapacity"
            className="w-full border rounded p-2 mt-1"
            value={data.physicalCapacity || ""}
            onChange={(e) => onChange("physicalCapacity", e.target.value)}
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="font-semibold">
            (ii) Stability, Poise, Fairness, Dependability
          </label>
          <input
            type="text"
            name="stability"
            className="w-full border rounded p-2 mt-1"
            value={data.stability || ""}
            onChange={(e) => onChange("stability", e.target.value)}
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="font-semibold">
            (iii) Mental Capacity: Analytical ability, power of expression,
            ability to participate in discussions
          </label>
          <input
            type="text"
            name="mentalCapacity"
            className="w-full border rounded p-2 mt-1"
            value={data.mentalCapacity || ""}
            onChange={(e) => onChange("mentalCapacity", e.target.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Section B */}
      <div className="space-y-2 mt-4">
        <h4 className="font-bold underline">B. Work Performance</h4>

        <div>
          <label className="font-semibold">
            (i) Aptitude for work: Initiative, self-reliance, thoroughness,
            sense of responsibility
          </label>
          <input
            type="text"
            name="aptitude"
            className="w-full border rounded p-2 mt-1"
            value={data.aptitude || ""}
            onChange={(e) => onChange("aptitude", e.target.value)}
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="font-semibold">
            (ii) Ability to manage: Capacity to take decisions, plan, supervise
            and guide
          </label>
          <input
            type="text"
            name="abilityToManage"
            className="w-full border rounded p-2 mt-1"
            value={data.abilityToManage || ""}
            onChange={(e) => onChange("abilityToManage", e.target.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Section C */}
      <div className="space-y-2 mt-4">
        <h4 className="font-bold underline">C. Interpersonal & Leadership</h4>

        <div>
          <label className="font-semibold">
            (i) Ability to get along: Tact, helpfulness to peers/subordinates
          </label>
          <input
            type="text"
            name="getAlong"
            className="w-full border rounded p-2 mt-1"
            value={data.getAlong || ""}
            onChange={(e) => onChange("getAlong", e.target.value)}
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="font-semibold">
            (ii) Potential for Academic Leadership
          </label>
          <input
            type="text"
            name="academicLeadership"
            className="w-full border rounded p-2 mt-1"
            value={data.academicLeadership || ""}
            onChange={(e) => onChange("academicLeadership", e.target.value)}
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="font-semibold">
            (iii) General appraisal including integrity and self-correction
          </label>
          <input
            type="text"
            name="generalAppraisal"
            className="w-full border rounded p-2 mt-1"
            value={data.generalAppraisal || ""}
            onChange={(e) => onChange("generalAppraisal", e.target.value)}
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="font-semibold">(iv) Special remarks</label>
          <input
            type="text"
            name="specialRemarks"
            className="w-full border rounded p-2 mt-1"
            value={data.specialRemarks || ""}
            onChange={(e) => onChange("specialRemarks", e.target.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Section D */}
      <div className="space-y-2 mt-4">
        <h4 className="font-bold underline">D. Final Recommendation</h4>

        <div>
          <label className="font-semibold">
            Fitness for regularization / confirmation / promotion
          </label>
          <input
            type="text"
            name="fitness"
            className="w-full border rounded p-2 mt-1"
            value={data.fitness || ""}
            onChange={(e) => onChange("fitness", e.target.value)}
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
