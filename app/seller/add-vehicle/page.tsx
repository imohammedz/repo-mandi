const steps = [
  {
    title: "Step 1: Basic Info",
    fields: ["Vehicle type", "Brand", "Model", "Year"],
  },
  {
    title: "Step 2: Location & Pricing",
    fields: ["State", "City", "Yard location", "Expected price", "Finance company"],
  },
  {
    title: "Step 3: Vehicle Condition",
    fields: ["Running/non-running", "Condition notes", "Accident notes"],
  },
  {
    title: "Step 4: Media Upload",
    fields: ["Drag/drop upload", "Camera upload", "Multiple photos"],
  },
  {
    title: "Step 5: Seller Details",
    fields: ["Name", "Mobile number", "Role"],
  },
  {
    title: "Final Step: Review & Submit",
    fields: ["Review all details", "Submit for verification"],
  },
];

export default function AddVehiclePage() {
  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-semibold text-slate-900">Add Vehicle</h1>
      <p className="text-sm text-slate-600">Simple mobile-first multi-step form for faster listing submissions.</p>

      {steps.map((step) => (
        <section key={step.title} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">{step.title}</h2>
          <div className="mt-3 space-y-2">
            {step.fields.map((field) => (
              <label key={field} className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">{field}</span>
                <input
                  placeholder={`Enter ${field.toLowerCase()}`}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </label>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <h3 className="text-base font-semibold text-emerald-800">Success Screen</h3>
        <p className="mt-1 text-sm text-emerald-700">Your vehicle has been submitted for verification.</p>
      </section>

      <button className="min-h-12 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white">Submit Listing</button>
    </main>
  );
}
