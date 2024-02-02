import React, { useRef, useState } from "react"
import style from "./style.module.css"
import rightArrow from "/right1.svg"
import downArrow from "/down1.svg"
import DirImg from "../components/DirImg"
import FileImg from "../components/FileImg"
import { useEffect } from "react"
import 'animate.css';
import { flushSync } from "react-dom"

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
                    tree[path + '/' + i] = false
                    getTree(fileTree[i], path + '/' + i)
                }
            })
        }
        getTree(fileTree, '/')
        return tree
    }

    //初始化折叠状态树
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

    let changeChosenBackgroundColorAndFoldState = (target,onlyHighLight=false) => {
        // console.log(target)
        let rootStyle = getComputedStyle(document.documentElement)
        let defaultColor = rootStyle.getPropertyValue('--default-background-color')
        let activeColor = rootStyle.getPropertyValue('--left-bar-active-color')
        // console.log(target)
        // console.log(Refs.current)
        if(!onlyHighLight){
            setFoldState({ ...foldState, [target]: !foldState[target] })
        }
        // console.log(Refs.current[target])
        Object.keys(Refs.current).forEach(i => {
            // console.log(Refs.current[i])
            Refs.current[i].current.style.backgroundColor = defaultColor
            if (i === target) {
                Refs.current[i].current.style.backgroundColor = activeColor
                if (onlyHighLight) {
                  return   
                }
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


    //打开文件
    let openFile = (target) => {
        let index = topBar.findIndex((i) => {
            return i.name == target.name && i.path == target.path
        })
        let list
        list = Array.from(topBar)
        list.forEach(i => {
            i.active = false
        })
        if (index == -1) {
            setTopBar([...list, {
                name: target.name,
                path: target.path,
                active: true
            }])
        }
        else {
            list[index].active = true
            setTopBar([...list])
        }

    }

    //关闭文件
    let closeFile = (target, e) => {
        // console.log("关闭")
        let index = topBar.findIndex((i) => {
            return i.name == target.name && i.path == target.path && i?.active
        })
        if (index > 0) {
            let list = Array.from(topBar)
            list[index].active = false
            list[index - 1].active = true
            setTopBar(list)
            //接下来还需要展示前一个文件内容
            //xxxx


            flushSync()
        }
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

    //顶栏中选中文件
    let showFile = (target) => {
        let list = Array.from(topBar)
        for (let i of list) {
            if (i.name == target.name && i.path == target.path) {
                i.active = true
                continue
            }
            i.active = false
        }
        setTopBar([...list])
        let a = target.path.split("/")
        a.shift()
        function parentPath(list) {
            let a = []
            list.forEach((i, index) => {
                if (index == 0) {
                    a.push("/" + i)
                    return;
                }
                a.push(a[index - 1] + "/" + i)
            })
            return a
        }
        a = parentPath(a)
        // console.log(a)
        // console.log(foldState)
        for (let i of a) {
            // console.log(i)
            if (!foldState[i]) {
                // console.log("找到false")
                changeChosenBackgroundColorAndFoldState(i,true)
                return
            }
        }
        changeChosenBackgroundColorAndFoldState(target.path + "/" + target.name)


    }

    //配置暂时先写这
    let [leftBarWidth, setLeftBarWidth] = useState(130)
    let [gap, setGap] = useState(5)


    let leftBarDom = useRef(null)
    let topBarDom = useRef(null)
    let createFileDom = (path, fileTree, index) => {
        //生成文件Dom树
        path = path === '/' ? '' : path
        return Object.keys(fileTree).map(i => {
            if (typeof fileTree[i] === 'string') {
                return (
                    <div key={path + "/" + i}>
                        {/* 注意，这里外面的一层div不能和下面的合并，这是为了和文件夹的结构对应，不然统一处理的时候会出问题 */}
                        <div title={path + "/" + i} className={`${style.border} ${style.file}`} style={{ width: `${leftBarWidth - 2}px`, display: "flex" }} ref={Refs.current[path + "/" + i]} onClick={() => { changeChosenBackgroundColorAndFoldState(path + "/" + i); openFile({ name: i, path: path }) }}>
                            {/* {console.log(Refs.current)} */}
                            <span style={{ width: "max-content", transform: `translateX(${gap * (index)}px)`, display: "flex", alignItems: "center" }}>
                                <FileImg fileType={i.split(".")[i.split(".").length - 1]}></FileImg>{i}</span>
                        </div>
                    </div>
                )
            } else {
                return (
                    <div key={path + "/" + i} style={{ display: "flex" }}>
                        <div title={path + "/" + i} className={`${style.border}`} style={{ display: "flex", flexDirection: "column" }}>
                            <div className={style.dir} style={{ width: "100%", display: "flex" }} ref={Refs.current[path + "/" + i]} onClick={() => changeChosenBackgroundColorAndFoldState(path + "/" + i)}>
                                <span style={{ width: "min-content", transform: `translateX(${gap * index}px)`, display: "flex", flexDirection: "row", alignItems: "center" }}>
                                    <img src={foldState[path + "/" + i] ? downArrow : rightArrow} alt="右箭头" className={style.label} />
                                    <DirImg></DirImg>
                                    {i}
                                </span>
                            </div>
                            <div className={`${style.border}  ${style.heightTransition}`} style={{ width: "100%", height: "0" }}>
                                {/* 高度初始化为0就是默认不展开 */}
                                {createFileDom(path + "/" + i, fileTree[i], index + 1)}
                            </div>
                        </div>
                    </div>
                )
            }
        })

    }

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
                    <div className={`${style.border}`} style={{ display: "flex", flexDirection: "column", width: `100%` }}>
                        <div className={style.dir} style={{ width: "100%", display: "flex" }} ref={Refs.current["/"]} onClick={() => changeChosenBackgroundColorAndFoldState('/')}>
                            <span style={{ width: "min-content", display: "flex", flexDirection: "row", alignItems: "center" }}>
                                <img src={foldState['/'] ? downArrow : rightArrow} alt="箭头" className={style.label} />
                                <DirImg></DirImg>
                                /
                            </span>
                        </div>
                        <div className={`${style.border} ${style.heightTransition}`} style={{ width: "100%" }}>
                            <div >{createFileDom('/', fileTree, 1)}</div>
                        </div>
                    </div>
                </div>

            </div>

            {/* 顶栏 */}
            <div className={`top-wrapper ${style.top_bar}`} ref={topBarDom} style={{
                position: "absolute", display: "flex", left: `${leftBarWidth + leftBarDom.current?.style.left.split("px")[0] * 1}px`,
                top: "0", fontSize: "14px", fontFamily: "Consolas, 'Courier New', monospace", height: "26px"
                , width: `calc(100vw - ${leftBarWidth + leftBarDom.current?.style.left.split("px")[0] * 2}px)`
            }}>
                {

                    topBar.map((item) => {
                        return (
                            <div key={item.path + '/' + item.name} title={item.path + '/' + item.name} className={`${style.filelabel} ${item.active ? style.active : null}  animate__animated animate__bounce  animate__fadeInBottomLeft animate__faster  `}
                                style={{ display: "flex", alignItems: "center", position: "relative", whiteSpace: "nowrap" }} onClick={() => showFile({ name: item.name, path: item.path })}>
                                <FileImg fileType={item.name.split(".")[item.name.split(".").length - 1]}></FileImg>
                                <span style={{ width: "96px", textOverflow: "ellipsis", overflow: "hidden" }}> {item.name} </span>
                                <img src="/remove.svg" alt="关闭" style={{ position: "absolute", right: "0", width: "20px", zIndex: "1" }} onClick={(e) => { e.stopPropagation(); closeFile({ path: item.path, name: item.name }, e) }} />
                            </div>
                        )
                    })
                }
                {/* <div className={style.filelabel} style={{ display: "flex", alignItems: "center",position:"relative",whiteSpace:"nowrap" }}><FileImg fileType="js" ></FileImg><span style={{width:"96px",textOverflow:"ellipsis",overflow:"hidden"}}>文件142141241241 </span> <img src="/remove.svg" alt="删除"  style={{position:"absolute",right:"0",width:"20px"}} /></div>
                <div className={style.filelabel} style={{ display: "flex", alignItems: "center" }}><FileImg></FileImg>文件2</div> */}
            </div>
            <div className={style.main_body} style={{
                position: "absolute", left: `${leftBarWidth + leftBarDom.current?.style.left.split("px")[0] * 1}px`, top: `${topBarDom.current?.style.height}`,
                height: `calc(100vh - ${0 + topBarDom.current?.style.height.split("px")[0] * 2}px)`, width: `calc(100vw - ${leftBarWidth + leftBarDom.current?.style.left.split("px")[0] * 2}px)`,
            }} >
                {children}
            </div>
        </div>
    )
}
