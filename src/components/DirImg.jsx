import style from "./style.module.css"
export default function DirImg(props) {
    return (
        <img src="/dir.svg" alt="文件夹" data-type={props.type} className={style.label} style={{margin:'0 3px',}} />
    )
}
