import style from "./style.module.css"
import defaultFileImg from "/FileImg/file.svg"
import js from "/FileImg/JavaScript.svg"
import py from "/FileImg/python.svg"
import c from "/FileImg/C.svg"
import txt from "/FileImg/txt.svg"
import zip from "/FileImg/压缩包.svg"
import tar from "/FileImg/压缩包.svg"
import cpp from "/FileImg/C++.svg"
import conf from '/FileImg/conf.svg'
import css from '/FileImg/css.svg'
import html from '/FileImg/HTML.svg'
import java from '/FileImg/java.svg'
import jar from '/FileImg/java.svg'
import jpg from '/FileImg/JPG.svg'
import json from '/FileImg/JSON.svg'
import log from '/FileImg/log.svg'
import md from '/FileImg/Markdown.svg'
import png from '/FileImg/png.svg'
import xml from '/FileImg/xml.svg'
import vue from '/FileImg/Vue.svg'
import love from '/FileImg/love.svg'
import jsx from '/FileImg/React.svg'
import ts from "/FileImg/typescript.svg"
import svg from '/FileImg/edge.svg'
import cjs from '/FileImg/conf.svg'
export default function FileImg(props) {

    props = {
        ...props,
        fileType: props.fileType ? props.fileType.toLowerCase() : 'default'
    }
    let fileTypes = {
        js, py, c, txt, zip, tar, cpp, conf, css, html, java,jar, jpg, json, log, md, png, xml,vue,jsx,love,ts,svg,cjs,
        default: defaultFileImg
    }
    return (
        <img src={fileTypes[props.fileType] ? fileTypes[props.fileType] : defaultFileImg} alt="文件" className={style.label} style={{ margin: '0 3px' }} />
    )
}
