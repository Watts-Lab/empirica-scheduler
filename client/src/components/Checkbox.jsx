import React, { useState } from "react";

export function Checkbox({
  name,
  value,
  label,
  checked,
  onChange,
  className = "",
}) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = (event) => {
    setIsChecked(event.target.checked);
    return onChange(event.target.checked);
  };

  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={isChecked}
        onChange={handleChange}
        className="mr-2"
      />
      <label htmlFor={value}>{label}</label>
    </div>
  );
}

//   return (
//     <p key={key}>
//       <input type="checkbox" name={name} value={value} />
//       <label htmlFor={value}>{label}</label>
//     </p>
//   );
// }
