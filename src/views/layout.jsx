import React, { useRef, useState } from "react"
import style from "./style.module.css"
import rightArrow from "/right1.svg"
import downArrow from "/down1.svg"
import DirImg from "../components/DirImg"
import FileImg from "../components/FileImg"
import { useEffect } from "react"
import 'animate.css';

export default function Layout({ children }) {
    const [fileTree, setFileTree] = useState({
        //文件树
        'usr': {
            'a': {
                'b.txt': "file",
                "gulugulu.c": "file"
            }
        },
        'root': {
            'test': {
                'c.txt': "file",
                'a': "file",
                'x': {
                    'a': 'file',
                    'test.js': 'file'
                },
            }
        },
    })
    const [topBar, setTopBar] = useState([])
    const [foldState, setFoldState] = useState({})
    //左侧导航栏文件夹打开状态树

    // let getDomNumber = (fileTree) => {
    //     let keys = Object.keys(fileTree)
    //     if(keys.length===0){
    //         return 0
    //     }
    //     return keys.length + keys.map(i => {
    //         if (typeof fileTree[i] === 'object')
    //             return getDomNumber(fileTree[i])
    //         else return 0
    //     }).reduce((total,num)=>total+num)
    // }
    // console.log(getDomNumber(fileTree))
    let initFoldState = (fileTree) => {
        let tree = {
            '/': true
        }
        let getTree = (fileTree, path) => {
            path = path === '/' ? '' : path
            Object.keys(fileTree).forEach(i => {
                if (typeof fileTree[i] === 'object') {
                    tree[path + '/' + i] = true
                    getTree(fileTree[i], path + '/' + i)
                }
            })
        }
        getTree(fileTree, '/')
        return tree
    }
    useEffect(() => {
        setFoldState(initFoldState(fileTree))
        // console.log(foldState)
    }, [])

    const Refs = useRef({})
    let initDomRefs = (path, fileTree, Refs) => {
        //将文件树映射成Dom树
        path = path === '/' ? '' : path
        Refs.current['/'] = React.createRef()
        Object.keys(fileTree).forEach(i => {
            if (!Refs.current[path + "/" + i])
                Refs.current[path + "/" + i] = React.createRef()
            if (typeof fileTree[i] === 'object') {
                initDomRefs(path + "/" + i, fileTree[i], Refs)
            }
        })
    }
    initDomRefs('/', fileTree, Refs)
    // console.log(Object.getOwnPropertyNames(Refs.current))
    useEffect(() => {
        //    let number=getDomNumber(fileTree)
        initDomRefs('/', fileTree, Refs)
        // console.log(Refs.current)

    }, [fileTree])

    let changeChosenBackgroundColorAndFoldState = (target) => {

        // console.log(target)
        // console.log(Refs.current)
        setFoldState({ ...foldState, [target]: !foldState[target] })
        // console.log(Refs.current[target])
        Object.keys(Refs.current).forEach(i => {
            // console.log(Refs.current[i])
            Refs.current[i].current.style.backgroundColor = ''
            if (i === target) {
                Refs.current[i].current.style.backgroundColor = '#e6e6e6'
                let brotherDom = Refs.current[i].current.parentNode.children[1]
                if (!brotherDom)
                    return
                let parentAutoHeight = () => {
                    //将层层往外设置父节点的高度，不然会出现父高度定死时，打开子节点后子节点溢出而不显示
                    let dom = brotherDom.parentNode
                    // console.log(dom.className)
                    while (dom.className != 'dir-wrapper') {
                        dom.style.height = 'auto'
                        dom = dom.parentNode
                    }
                }
                if (foldState[target]) {
                    brotherDom.style.height = '0px'
                    parentAutoHeight()
                }
                else {
                    parentAutoHeight()
                    brotherDom.style.height = "auto"
                    let height = brotherDom.getBoundingClientRect().height
                    brotherDom.style.height = 0
                    brotherDom.offsetHeight;
                    if (target !== '/') {
                        brotherDom.style.height = height + "px"
                        return
                    }
                    brotherDom.style.height = "100%"

                }
            }
        })


    }

    let openFile = (target) => {
        if (!topBar.some((i) => {
            return i.name == target.name && i.path == target.path
        }))
            setTopBar([...topBar, {
                name: target.name,
                path: target.path
            }])
    }
    let closeFile = (target, e) => {
        // console.log("关闭")
        e.target.parentNode.className += "animate__fadeOutBottomLeft"
        setTimeout(() => {
            let index = topBar.findIndex((i) => {
                return i.name == target.name && i.path == target.path
            })
            let list = Array.from(topBar)
            list.splice(index, 1)
            if (index != -1)
                setTopBar([...list])
        }, 500);

    }

    let createFileDom = (path, fileTree, index) => {
        //生成文件Dom树
        path = path === '/' ? '' : path
        return Object.keys(fileTree).map(i => {
            if (typeof fileTree[i] === 'string') {
                return (
                    <div key={path + "/" + i}>
                        {/* 注意，这里外面的一层div不能和下面的合并，这是为了和文件夹的结构对应，不然统一处理的时候会出问题 */}
                        <div title={path + "/" + i} className={`${style.border} ${style.file}`} style={{ width: "100px", display: "flex" }} ref={Refs.current[path + "/" + i]} onClick={() => { changeChosenBackgroundColorAndFoldState(path + "/" + i); openFile({ name: i, path: path }) }}>
                            {/* {console.log(Refs.current)} */}
                            <span style={{ width: "max-content", transform: `translateX(${10 * (index)}px)`, display: "flex", alignItems: "center" }}>
                                <FileImg fileType={i.split(".")[i.split(".").length - 1]}></FileImg>{i}</span>
                        </div>
                    </div>
                )
            } else {
                return (
                    <div key={path + "/" + i} style={{ display: "flex" }}>
                        <div title={path + "/" + i} className={`${style.border}`} style={{ display: "flex", flexDirection: "column" }}>
                            <div className={style.dir} style={{ width: "100px", display: "flex" }} ref={Refs.current[path + "/" + i]} onClick={() => changeChosenBackgroundColorAndFoldState(path + "/" + i)}>
                                <span style={{ width: "min-content", transform: `translateX(${10 * index}px)`, display: "flex", flexDirection: "row", alignItems: "center" }}>
                                    <img src={foldState[path + "/" + i] ? downArrow : rightArrow} alt="右箭头" className={style.label} />
                                    <DirImg></DirImg>
                                    {i}
                                </span>
                            </div>
                            <div className={`${style.border}  ${style.heightTransition}`} style={{ width: "100px" }}>
                                {createFileDom(path + "/" + i, fileTree[i], index + 1)}
                            </div>
                        </div>
                    </div>
                )
            }
        })

    }
    let [leftBarWidth, setLeftBarWidth] = useState(100)
    let leftBarDom = useRef(null)
    let topBarDom = useRef(null)
    return (
        <div>
            <div className={style.leftBar} style={{ display: "flex", flexDirection: "column", width: `${leftBarWidth}px`, left: "5px" }} ref={leftBarDom}>
                <div style={{ width: "100%", height: "20px", display: "flex", justifyContent: "flex-end" }}>
                    <img src="/FileImg/file.svg" width="15px" height="15px" alt="新增文件" className={style.choice} />
                    <img src="/dir.svg" width="15px" height="15px" alt="新增文件夹" className={style.choice} />
                    <img src="/delete.svg" width="15px" height="15px" alt="删除" className={style.choice} />
                    <img src="/refresh.svg" width="15px" height="15px" alt="刷新" className={style.choice} />
                </div>
                <div style={{ display: "flex" }} className="dir-wrapper">
                    <div className={`${style.border}`} style={{ display: "flex", flexDirection: "column" }}>
                        <div className={style.dir} style={{ width: "100px", display: "flex" }} ref={Refs.current["/"]} onClick={() => changeChosenBackgroundColorAndFoldState('/')}>
                            <span style={{ width: "min-content", display: "flex", flexDirection: "row", alignItems: "center" }}>
                                <img src={foldState['/'] ? downArrow : rightArrow} alt="箭头" className={style.label} />
                                <DirImg></DirImg>
                                /
                            </span>
                        </div>
                        <div className={`${style.border} ${style.heightTransition}`} style={{ width: "100px" }}>
                            <div >{createFileDom('/', fileTree, 1)}</div>
                        </div>
                    </div>
                </div>

            </div>
            <div className="top-wrapper" ref={topBarDom} style={{
                position: "absolute", display: "flex", left: `${leftBarWidth + leftBarDom.current?.style.left.split("px")[0] * 1}px`,
                top: "0", fontSize: "14px", fontFamily: "Consolas, 'Courier New', monospace", height: "26px", borderBottom: "1px solid black", borderRight: "1px solid black"
                , borderTop: "1px solid black", width: `calc(100vw - ${leftBarWidth + leftBarDom.current?.style.left.split("px")[0] * 2}px)`
            }}>
                {/* {console.log(topBar)} */}
                {

                    topBar.map((item) => {
                        return (
                            <div key={item.path + '/' + item.name} title={item.path + '/' + item.name} className={`${style.filelabel}  animate__animated animate__bounce  animate__fadeInBottomLeft animate__faster  `}
                                style={{ display: "flex", alignItems: "center", position: "relative", whiteSpace: "nowrap" }}>
                                <FileImg fileType={item.name.split(".")[item.name.split(".").length - 1]}></FileImg>
                                <span style={{ width: "96px", textOverflow: "ellipsis", overflow: "hidden" }}> {item.name} </span>
                                <img src="/remove.svg" alt="关闭" style={{ position: "absolute", right: "0", width: "20px", zIndex: "1" }} onClick={(e) => closeFile({ path: item.path, name: item.name }, e)} />
                            </div>
                        )
                    })
                }
                {/* <div className={style.filelabel} style={{ display: "flex", alignItems: "center",position:"relative",whiteSpace:"nowrap" }}><FileImg fileType="js" ></FileImg><span style={{width:"96px",textOverflow:"ellipsis",overflow:"hidden"}}>文件142141241241 </span> <img src="/remove.svg" alt="删除"  style={{position:"absolute",right:"0",width:"20px"}} /></div>
                <div className={style.filelabel} style={{ display: "flex", alignItems: "center" }}><FileImg></FileImg>文件2</div> */}
            </div>
            <div style={{ position: "absolute", left: `${leftBarWidth + leftBarDom.current?.style.left.split("px")[0] * 1}px`, top: `${topBarDom.current?.style.height}` }}>
                {children}
            </div>
        </div>
    )
}
