import style from './style.module.css'

export default function MenuItem(props) {

    return (
        <div style={{ width: "100%", height: "20px", border: "1px solid black", ...props.style }} className={`${style.item} `} onMouseEnter={(e) => {
            e.target.className += style.item_hover
        }} onMouseLeave={(e) => {
            e.target.className = e.target.className.replace(style.item_hover, "")
        }} onClick={props.onClick}>
            {props.children}
        </div>
    )
}
