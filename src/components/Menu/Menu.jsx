import { forwardRef } from "react"
import style from "./style.module.css"
export default forwardRef(function Menu(props, ref) {

    return (

        <div ref={ref} className={`${style.menu_boder} ${style.menu}`} style={{ position: "absolute", width: "max-content",padding:"5px 0", height: "max-content", ...props.style }}>
            {props.children}
        </div>
    )
})
