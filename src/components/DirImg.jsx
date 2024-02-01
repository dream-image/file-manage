import style from "./style.module.css"
export default function DirImg() {
    return (
        <img src="/dir.svg" alt="文件夹" className={style.label} style={{margin:'0 3px',}} />
    )
}
