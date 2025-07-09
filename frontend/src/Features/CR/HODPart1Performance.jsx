import React from "react";

export default function HODPart1Performance({ data, onChange, readOnly }) {
  const faculty = data.faculty || {};

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <h3 className="text-xl font-bold mb-4 text-[#145DA0]">
        Part I: Performance Assessment
      </h3>

      {/* Faculty Info */}
      <div className="grid grid-cols-[350px_1fr] items-center gap-y-2 text-sm">
        <span className="font-semibold">1. (a) Name (in block letters)</span>
        <span>: {faculty.name}</span>

        <span className="font-semibold">
          &nbsp;&nbsp;&nbsp;(b) Date of Birth and Age
        </span>
        <span>
          :{" "}
          {faculty.dob
            ? `${new Date(faculty.dob).toLocaleDateString()} / ${
                new Date().getFullYear() - new Date(faculty.dob).getFullYear()
              } years`
            : ""}
        </span>

        <span className="font-semibold">
          &nbsp;&nbsp;&nbsp;(c) Qualifications
        </span>
        <span>: {faculty.qualifications}</span>

        <span className="font-semibold">2. Designation</span>
        <span>: {faculty.designation}</span>

        <span className="font-semibold">3. Scale of pay and present pay</span>
        <span>
          : {faculty.scaleOfPay} / {faculty.presentPay}
        </span>

        <span className="font-semibold">
          4. Post or posts held and nature of appointment
          <br />
          <span className="text-sm font-normal">
            (i.e. Temporary / Probationer / Approved Probationer / Permanent)
          </span>
        </span>
        <span>: {faculty.postHeld}</span>
      </div>

      {/* Performance Inputs */}
      <div className="space-y-4 mt-4 text-sm">
        <div>
          <label className="font-semibold">
            5. Ability as a teacher as evidenced from the performance of
            students in the subject taught by him:
          </label>
          <div className="ml-6 mt-2 space-y-2">
            <div>
              i) Control over the class and popularity among students:
              <input
                name="controlClass"
                value={data.controlClass || ""}
                onChange={(e) => onChange("controlClass", e.target.value)}
                className="w-full rounded border px-2 py-1 mt-1"
                disabled={readOnly}
              />
            </div>
            <div>
              ii) Students counselling and interest in student welfare:
              <input
                name="studentCounseling"
                value={data.studentCounseling || ""}
                onChange={(e) => onChange("studentCounseling", e.target.value)}
                className="w-full rounded border px-2 py-1 mt-1"
                disabled={readOnly}
              />
            </div>
            <div>
              iii) Average percentage of pass in the subject taught by him:
              <input
                name="avgPassPercentage"
                value={data.avgPassPercentage || ""}
                onChange={(e) => onChange("avgPassPercentage", e.target.value)}
                className="w-full rounded border px-2 py-1 mt-1"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="font-semibold">
            6. Comments on maintenance of class records:
          </label>
          <input
            name="classRecords"
            value={data.classRecords || ""}
            onChange={(e) => onChange("classRecords", e.target.value)}
            className="w-full rounded border px-2 py-1 mt-1"
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="font-semibold">
            7. Contributions to development of the institution:
          </label>
          <textarea
            name="contributions"
            value={data.contributions || ""}
            onChange={(e) => onChange("contributions", e.target.value)}
            className="w-full rounded border px-2 py-1 mt-1"
            disabled={readOnly}
            rows="3"
          />
        </div>

        <div>
          <label className="font-semibold">
            8. Interest in and ability for research:
          </label>
          <textarea
            name="researchAbility"
            value={data.researchAbility || ""}
            onChange={(e) => onChange("researchAbility", e.target.value)}
            className="w-full rounded border px-2 py-1 mt-1"
            disabled={readOnly}
            rows="3"
          />
        </div>

        <div>
          <label className="font-semibold">9. Professional standing:</label>
          <input
            name="professionalStanding"
            value={data.professionalStanding || ""}
            onChange={(e) => onChange("professionalStanding", e.target.value)}
            className="w-full rounded border px-2 py-1 mt-1"
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="font-semibold">
            10. Extra-curricular responsibilities held:
          </label>
          <input
            name="extraCurricular"
            value={data.extraCurricular || ""}
            onChange={(e) => onChange("extraCurricular", e.target.value)}
            className="w-full rounded border px-2 py-1 mt-1"
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="font-semibold">
            11. Willingness to accept work and cooperate:
          </label>
          <input
            name="willingness"
            value={data.willingness || ""}
            onChange={(e) => onChange("willingness", e.target.value)}
            className="w-full rounded border px-2 py-1 mt-1"
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="font-semibold">
            12. Lapses pointed out / punishment awarded:
          </label>
          <input
            name="lapses"
            value={data.lapses || ""}
            onChange={(e) => onChange("lapses", e.target.value)}
            className="w-full rounded border px-2 py-1 mt-1"
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="font-semibold">13. Overall rating:</label>
          <input
            name="overallRating"
            value={data.overallRating || ""}
            onChange={(e) => onChange("overallRating", e.target.value)}
            className="w-full rounded border px-2 py-1 mt-1"
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
