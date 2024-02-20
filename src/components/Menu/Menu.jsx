import { forwardRef } from "react"

export default forwardRef(function Menu(props, ref) {

    return (

        <div ref={ref} style={{ position: "absolute", width: "100px", height: "max-content", border: "none", ...props.style }}>
            {props.children}
        </div>
    )
})
