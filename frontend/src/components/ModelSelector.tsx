import type { Provider } from "../types";

type Props = {
  providers: Provider[];
  providerId: string;
  modelId: string;
  onProviderChange: (id: string) => void;
  onModelChange: (id: string) => void;
};

export default function ModelSelector({
  providers,
  providerId,
  modelId,
  onProviderChange,
  onModelChange,
}: Props) {
  const provider = providers.find((p) => p.id === providerId);

  return (
    <div className="model-selector">
      <label>
        Provider
        <select
          value={providerId}
          onChange={(e) => onProviderChange(e.target.value)}
        >
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.id}
          </option>
        ))}
        </select>
      </label>

      <label>
        Model
        <select
          value={modelId}
          onChange={(e) => onModelChange(e.target.value)}
        >
          {provider?.models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
