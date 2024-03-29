import style from './style.module.css'

export default function MenuItem(props) {

    return (
        <div style={{ width: "100%", height: "20px",  padding: "0 20px",boxSizing:"border-box",borderRadius: "8px", ...props.style }} className={`${style.item} `} onMouseEnter={(e) => {
            e.target.className += style.item_hover
        }} onMouseLeave={(e) => {
            e.target.className = e.target.className.replace(style.item_hover, "")
        }} onClick={props.onClick}>
            {props.children}
            {props.rightText ? <span style={{ width: "max-content", position: "absolute", right: "20px",fontWeight:"500" }}>{props.rightText}</span> : null}
        </div>
    )
}
