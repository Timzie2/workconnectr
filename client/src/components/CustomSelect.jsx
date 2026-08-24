import { useState, useRef, useEffect } from "react"
import { FiChevronDown } from "react-icons/fi"
import "../styles/CustomSelect.css"

function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select",
  showIcons = true,
  allowRequest = true
}) {

  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {

    function handleClickOutside(e) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      )

  }, [])

  const selected =
    options.find(
      option => option.name === value
    )

  return (

  <div
    className={`custom-select ${open ? "open" : ""}`}
    ref={wrapperRef}
  >

      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setOpen(!open)}
      >

        {selected ? (
          <>

            <>
  {showIcons && selected?.icon && (
    <span
      className="category-dot"
      style={{
        background: selected.color
      }}
    >
      {selected.icon}
    </span>
  )}

  <span>{selected.name}</span>
</>

          </>
        ) : (

          <span className="placeholder">
            {placeholder}
          </span>

        )}

        <FiChevronDown
          className={open ? "rotate" : ""}
        />

      </button>

      {open && (

        <div className="custom-select-menu">

          {options.map(option => (

  <button
    key={option.id}
    type="button"
    className="custom-select-option"
    onClick={() => {

      onChange(option.name)
      setOpen(false)

    }}
  >

    <>
  {showIcons && option.icon && (
    <span
      className="category-dot"
      style={{
        background: option.color
      }}
    >
      {option.icon}
    </span>
  )}

  <span>{option.name}</span>
</>

  </button>

))}

{allowRequest && (

  <button
    type="button"
    className="custom-select-option"
    onClick={() => {
      onChange("__request__")
      setOpen(false)
    }}
  >

    <span className="category-dot">
      ✨
    </span>

    <span>Can't find your category? Request one</span>

  </button>

)}

        </div>

      )}

    </div>

  )

}

export default CustomSelect