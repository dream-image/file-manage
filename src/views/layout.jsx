import React, { useRef, useState } from "react"
import style from "./style.module.css"
import rightArrow from "/right.svg"
import downArrow from "/down.svg"
import { useEffect, useLayoutEffect } from "react"
export default function Layout({ children, ...props }) {
    const [fileTree, setFileTree] = useState({
        //文件树
        'usr': {
            'a': {
                'b.txt': "file"
            }
        },
        'root': {
            'test': {
                'c.txt': "file",
                'a': "file",
                'x': {
                    'a': 'file'
                },
            }
        },
    })
    const [foldState, setFoldState] = useState({}) 
    //文件夹打开状态树

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
                let parentAutoHeight=()=>{
                    //将层层往外设置父节点的高度，不然会出现父高度定死时，打开子节点后子节点溢出而不显示
                    let dom=brotherDom.parentNode
                    // console.log(dom.className)
                    while(dom.className!='dir-wrapper'){
                        dom.style.height='auto'
                        dom=dom.parentNode
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

    let createFileDom = (path, fileTree, index) => {
        //生成文件Dom树
        path = path === '/' ? '' : path
        return Object.keys(fileTree).map(i => {
            if (typeof fileTree[i] === 'string') {
                return (
                    <div key={path + "/" + i}> 
                    {/* 注意，这里外面的一层div不能和下面的合并，这是为了和文件夹的结构对应，不然统一处理的时候会出问题 */}
                        <div className={`${style.border} ${style.file}`} style={{ width: "100px", display: "flex" }} ref={Refs.current[path + "/" + i]} onClick={() => changeChosenBackgroundColorAndFoldState(path + "/" + i)}>
                            {/* {console.log(Refs.current)} */}
                            <span style={{ width: "min-content", transform: `translateX(${10 * (index)}px)` }}>{i}</span>
                        </div>
                    </div>
                )
            } else {
                return (
                    <div key={path + "/" + i} style={{ display: "flex" }}>
                        <div className={`${style.border}`} style={{ display: "flex", flexDirection: "column" }}>
                            <div className={style.dir} style={{ width: "100px", display: "flex" }} ref={Refs.current[path + "/" + i]} onClick={() => changeChosenBackgroundColorAndFoldState(path + "/" + i)}>
                                <span style={{ width: "min-content", transform: `translateX(${10 * index}px)`, display: "flex", flexDirection: "row", alignItems: "center" }}>
                                    <img src={foldState[path + "/" + i] ? downArrow : rightArrow} alt="右箭头" className={style.babel} />{i}
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

    return (
        <div>
            <div className={style.leftBar} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ width: "100%", height: "20px", display: "flex", justifyContent: "flex-end" }}>
                    <img src="/file.svg" width="15px" height="15px" alt="新增文件" className={style.choice} />
                    <img src="/dir.svg" width="15px" height="15px" alt="新增文件夹" className={style.choice} />
                    <img src="/delete.svg" width="15px" height="15px" alt="删除" className={style.choice} />
                    <img src="/refresh.svg" width="15px" height="15px" alt="刷新" className={style.choice} />
                </div>
                <div style={{ display: "flex" }} className="dir-wrapper">
                    <div className={`${style.border}`} style={{ display: "flex", flexDirection: "column" }}>
                        <div className={style.dir} style={{ width: "100px", display: "flex" }} ref={Refs.current["/"]} onClick={() => changeChosenBackgroundColorAndFoldState('/')}>
                            <span style={{ width: "min-content", display: "flex", flexDirection: "row", alignItems: "center" }}>
                                <img src={foldState['/'] ? downArrow : rightArrow} alt="箭头" className={style.babel} />/
                            </span>
                        </div>
                        <div className={`${style.border} ${style.heightTransition}`} style={{ width: "100px" }}>
                            <div >{createFileDom('/', fileTree, 1)}</div>
                        </div>
                    </div>
                </div>

            </div>

            {children}
        </div>
    )
}
