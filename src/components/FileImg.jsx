import style from "./style.module.css"
import defaultFileImg from "/FileImg/file.svg"
import JS from "/FileImg/JavaScript.svg"
import Python from "/FileImg/python.svg"
import C from "/FileImg/C.svg"
import TXT from "/FileImg/txt.svg"
import * as svg from "/FileImg/*.svg"

export default function FileImg(props) {
    console.log(svg)
    props={
        ...props,
        fileType:props.fileType?props.fileType.toLowerCase():'default'
    }
    let fileTypes={
        js:JS,
        py:Python,
        c:C,
        txt:TXT,
        default:defaultFileImg
    }
    return (
        <img src={fileTypes[props.fileType]?fileTypes[props.fileType]:defaultFileImg} alt="文件" className={style.label} style={{margin:'0 3px'}} />
    )
}
