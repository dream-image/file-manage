import { forwardRef } from "react"

export default forwardRef(function Menu(props, ref) {

    return (

        <div ref={ref} style={{ position: "absolute", width: "100px", height: "max-content", border: "1px solid black", ...props.style }}>
            {props.children}
        </div>
    )
})
