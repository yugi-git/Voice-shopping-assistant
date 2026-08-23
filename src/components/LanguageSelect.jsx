import { SUPPORTED_LANGUAGES } from '../lib/data'

export default function LanguageSelect({ value, onChange }) {
  return (
    <label className="lang-select">
      <span className="lang-select__label">Language</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  )
}
