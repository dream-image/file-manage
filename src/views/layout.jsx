import React, { useRef, useState } from "react"
import style from "./style.module.css"

import style_from_demo from '../index.module.css'

import rightArrow from "/right1.svg"
import downArrow from "/down1.svg"
import DirImg from "../components/DirImg"
import FileImg from "../components/FileImg"
import CloseDir from "../components/CloseDir"
import Dot from "../components/Dot"
import { useEffect } from "react"
import 'animate.css';
import { flushSync } from "react-dom"
import { useContext } from "react"
import Context from "../contexts/Context"
import { copy } from "../utils/copyObject"
import { handlePropertyName } from "../utils/symbols"
import { Button, notification, Space } from 'antd'
import { FolderOpenTwoTone, UndoOutlined, DeleteOutlined, FolderAddOutlined, FileAddOutlined } from '@ant-design/icons'
//构建文件Dom节点列表的时候，结尾加上后缀来区分是文件还是文件夹
const fileSuffix = '#file'
const dirSuffix = '#dir'

export default function Layout({ children }) {
    const store = useContext(Context)
    const [state, setState] = useState(store.getState())
    useEffect(() => {

        let unsubscribe = store.subscribe(() => {
            setState(store.getState())
        })
        return () => {
            unsubscribe()
        }
    }, [])
    //配置暂时先写这
    let [leftBarWidth, setLeftBarWidth] = useState(130)//左侧栏的默认宽度
    let [gap, setGap] = useState(5) //文件夹首与其子目录首的距离
    let [loading, setLoading] = useState(false) //打开文件的加载状态
    let [isOpen, setIsOpen] = useState(false)//是否已打开文件
    let [currentDirHandle, setCurrentDirHandle] = useState(null)//当前目录的句柄
    // console.log(CurrentFocus,changeFocus)
    const [fileTree, setFileTree] = useState([
        //文件树
        //规定：每个{}内只能有一个属性,即[]中的每一项是一个文件/文件夹
        {
            'usr': [
                {
                    'a': [
                        { 'b.txt': "file" },
                        { "gulugulu.c": "file" },
                        { "hello.vue": "file" },
                        { "hello.jsx": "file" }
                    ]
                },
            ],
        },
        {
            'root': [
                {
                    'test': [
                        {
                            'x': [
                                { 'a': 'file' },
                                { 'test.js': 'file' },
                                { 'helloWorld.java': 'file' },
                                { 'xycxd.love': 'file' }
                            ],
                        },
                        { 'c.txt': "file" },
                        { 'a': "file" },
                        { 'x': "file" }
                    ],

                },
                {
                    'test1': "file"
                }
            ],

        },
        {
            'test': "file"
        }
    ])
    const [showedFile, setShowedFile] = useState(shallowFile(fileTree))

    function shallowFile(fileTree) {

        let obj = []
        fileTree.forEach(i => {
            let name = Object.keys(i)[0]
            obj.push({
                [name]: i[name] instanceof Array ? [] : "file"
            })
        })
        return obj
    }
    let sort = (a, b) => {
        const aValue = Object.values(a)[0];
        const bValue = Object.values(b)[0];

        if (aValue === "file" && bValue !== "file") {
            return 1; // 文件排在文件夹后面
        } else if (aValue !== "file" && bValue === "file") {
            return -1; // 文件夹排在文件前面
        } else {
            // 相同类型的节点，按照名称进行排序
            const aKey = Object.keys(a)[0];
            const bKey = Object.keys(b)[0];
            return aKey.localeCompare(bKey);
        }
    }
    const [topBar, setTopBar] = useState([])

    const [foldState, setFoldState] = useState({})
    //左侧导航栏文件夹打开状态树
    // const [oldFoldState, setOldFoldState] = useState({})


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
            fileTree.forEach((i, index) => {
                Object.keys(i).forEach((j) => {
                    // console.log(,i[j])
                    if (i[j] instanceof Array) {
                        tree[path + '/' + j + dirSuffix] = false
                        getTree(i[j], path + '/' + j)
                    }
                })

            })
        }
        getTree(fileTree, '/')
        return tree
    }

    //初始化折叠状态树
    useEffect(() => {
        setFoldState(initFoldState(fileTree))
        // flushSync()
        // console.log(foldState)
    }, [])

    const Refs = useRef({})
    Refs.current['/'] = React.createRef()
    let initDomRefs = (path, node, Refs) => {
        //将文件树映射成Dom树
        path = path === '/' ? '' : path
        if (node.length === 0)
            return
        node.forEach(j => {
            Object.keys(j).forEach(i => {
                if (j[i] instanceof Array) {
                    // if (!Refs.current[path + "/" + i + dirSuffix])
                    Refs.current[path + "/" + i + dirSuffix] = React.createRef()
                    initDomRefs(path + "/" + i, j[i], Refs)
                } else {
                    // if (!Refs.current[path + "/" + i + fileSuffix])
                    Refs.current[path + "/" + i + fileSuffix] = React.createRef()
                }
            })

        })
    }
    initDomRefs('/', showedFile, Refs)
    // console.log(Refs)
    // console.log(Object.getOwnPropertyNames(Refs.current))
    //复杂的修改折叠状态时的副作用处理
    function changeFoldState(model, target = "", value) {
        let tree = copy(showedFile)
        let path = target.split('/')
        path.shift()
        path.push(path.pop().split(dirSuffix)[0])
        // console.log(path)
        if (model === 'inverse') {
            function goto(path, node, index, showNode) {
                let index2 = 0;
                // console.log(node)
                // console.log(showNode)
                for (let i of node) {
                    let name = Object.keys(i)[0]
                    // console.log(name)
                    if (i[name] instanceof Array && name === path[index]) {
                        if (index < path.length - 1)
                            return goto(path, i[name], index + 1, showNode[index2][name])
                        if (!value) {
                            // showNode[index2][name].splice(0, showNode[index2][name].length)
                        }
                        else {
                            if (showNode[index2][name].length == 0)
                                showNode[index2][name] = [...copy(i[name].sort(sort))]
                        }
                        return true
                    }
                    index2++;
                }
                return false
            }
            let result = goto(path, fileTree, 0, tree)
            // console.log(result)
            // console.log(tree)
            // console.log(fileTree)
            if (result) {
                Refs.current = {}
                Refs.current['/'] = React.createRef()
                initDomRefs('/', tree, Refs)
                setShowedFile(tree)
                // flushSync()
            }
        }
    }
    let changeChosenBackgroundColorAndFoldState = (target, onlyHighLight = false) => {

        if (!onlyHighLight && (new RegExp(dirSuffix).test(target) || target === '/')) {
            setFoldState({ ...foldState, [target]: !foldState[target] })
            changeFoldState("inverse", target, !foldState[target])
        }
        setTimeout(() => {
            Object.keys(Refs.current).forEach(i => {

                if (Refs.current[i].current)
                    Refs.current[i].current.className = `${style.dir}`
                if (i === target) {

                    Refs.current[i].current.className = `${style.dir} ${style.dir_active}`
                    if (new RegExp(fileSuffix).test(target)) {
                        store.dispatch({
                            type: 'currentFocus',
                            data: {
                                type: "file",
                                targetString: target
                            }
                        })
                    }

                    // let index=i.lastIndexOf('\/')
                    // changeFocus({
                    //     name: i.substring(index+1),
                    //     path: i.substring(0,index),

                    // })
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
            // console.log(CurrentFocus)
        }, 100)
    }

    function findFile(wholePath) {
        let file = state.openedFileContext[wholePath]
        return file ? file : null
    }
    function findHandle(wholePath) {
        let path = wholePath.split('/')
        path.shift()
        path[path.length - 1] = path[path.length - 1].split('#')[0]
        function find(path, handle, index) {
            if (handle.kind === 'file') {
                return handle
            }
            if (path.length == index - 1) {
                return handle
            }
            for (let i of handle.children) {
                if (i.name === path[index]) {
                    return find(path, i, index + 1)
                }
            }
        }
        return find(path, currentDirHandle, 0)
    }

    //本地读取文件夹
    let openDir = async (handle) => {
        try {
            if (!handle) {
                handle = await showDirectoryPicker()
            }

            let tree = []
            async function processHandle(handle, node) {
                if (handle.kind === 'file') {
                    node.push({ [handle.name]: "file" })
                    return handle
                }
                handle.children = []
                const iter = handle.entries()
                for await (let [name, inode] of iter) {
                    // console.log(name, inode)
                    if (inode.kind === 'directory') {
                        node.push({ [name]: [] })
                        handle.children.push(await processHandle(inode, node[node.length - 1][name]))
                    }
                    else {
                        node.push({ [name]: "file" })
                        handle.children.push(inode)
                    }
                }
                return handle
            }
            setLoading(true)
            const rootHandle = await processHandle(handle, tree)
            // console.log(tree)
            //将第一层的句柄都拿出来
            let obj = {}
            // console.log(rootHandle)
            rootHandle.children.forEach(i => {
                // console.log(i.name)
                obj[i.name + (i.kind === 'file' ? fileSuffix : dirSuffix)] = {
                    [handlePropertyName]: i,
                    children: {}
                }
            })
            // console.log(obj)
            store.dispatch({
                type: 'currentFocus',
                data: {
                    dirRootHandle: rootHandle
                }
            })

            setCurrentDirHandle(rootHandle)
            setLoading(false)
            setIsOpen(true)
            // console.log(tree)
            tree.sort(sort)
            // console.log(tree)
            console.log("文件读取完毕")
            Refs.current = {}
            Refs.current['/'] = React.createRef()
            initDomRefs('/', tree, Refs)
            setFileTree(tree)
            setFoldState(initFoldState(tree))
            setShowedFile(shallowFile(tree))

        } catch (error) {
            console.log(error)
            setLoading(false)
            setIsOpen(false)
            // console.log("")
        }

    }
    // 关闭当前打开文件夹
    let closeDir = (refresh) => {
        if (!refresh) {
            setCurrentDirHandle(null)
        }

        setIsOpen(false)
        Refs.current = {}
        Refs.current['/'] = React.createRef()
        setFileTree([])
        setFoldState([])
        setShowedFile([])
        store.dispatch({
            type: 'clear'
        })
        setTopBar([])
    }

    //打开文件
    let openFile = async (target) => {
        let index = topBar.findIndex((i) => {
            return i.name == target.name && i.path == target.path
        })
        let list
        list = copy(topBar)
        list.forEach(i => {
            i.active = false
        })
        let handle = findHandle(target.wholePath)
        if (index == -1) {
            setTopBar([...list, {
                name: target.name,
                path: target.path,
                active: true,
                wholePath: target.wholePath
            }])
            // console.log(target.wholePath)

            // console.log(handle)
            let file = await handle.getFile()
            const reader = new FileReader()

            reader.onload = (e) => {
                // console.log(e.target.result)
                let type = file.type.split("/")
                type = type[type.length - 1]
                store.dispatch({
                    type: 'openedFile',
                    data: {
                        [target.wholePath]: {
                            handle: handle,
                            hasChange: false,
                            copyContext: e.target.result,
                            originContext: e.target.result,
                            type: type
                        }
                    }
                })
                store.dispatch({
                    type: 'currentFocus',
                    data: {
                        currentHandle: handle,
                        targetString: target.wholePath
                    }
                })

            }
            reader.readAsText(file, 'utf-8')
        }
        else {
            list[index].active = true
            setTopBar([...list])
            store.dispatch({
                type: 'currentFocus',
                data: {
                    currentHandle: handle,
                    targetString: target.wholePath
                }
            })
        }

        // console.log(handle, target.wholePath)

    }
    const [globalMessageBox, setGlobalMessageBox] = useState(false)

    //关闭文件
    let sign = useRef()
    let closeFile = async (target, e) => {
        console.log(target)
        // console.log("关闭")
        sign.current = ''
        let save = () => {
            try {
                (async () => {
                    let writable = await state.currentFocusContext.currentHandle.createWritable();
                    console.log(state.currentFocusContext.currentHandle)
                    await writable.write(fileContext.copyContext);
                    await writable.close()
                    store.dispatch({
                        type: "openedFile",
                        data: {
                            [state.currentFocusContext.targetString]: {
                                ...fileContext,
                                hasChange: false,
                                originContext: fileContext.copyContext
                            }
                        }
                    })
                })()
            } catch (error) {
                console.log(error)
                message.open({
                    type: 'error',
                    content: "保存失败，请刷新页面再试"
                })
            }
        }
        //将文件从topbar移除
        let handle = () => {
            let index = topBar.findIndex((i) => {
                return i.name == target.name && i.path == target.path
            })
            e.target.parentNode.className += "animate__fadeOutBottomLeft"


            setTimeout(() => {
                let list = copy(topBar)
                // console.log(index)
                // console.log(list)
                list[index].active = false
                // console.log(index)
                if (index > 0)
                    list[index - 1].active = true
                else {
                    if (list[1])
                        list[1].active = true
                }

                list.splice(index, 1)
                console.log(list)
                if (index != -1)
                    setTopBar([...list])

                //接下来还需要展示前一个文件内容
                //xxxx
                store.dispatch({
                    type: "currentFocus",
                    data: {
                        targetString: index == 0 ? list[1] ? list[1].wholePath : "" : list[index - 1].wholePath,
                        type: "file"
                    }
                })
                store.dispatch({
                    type: "closeFile",
                    wholePath: target.wholePath
                })
                // flushSync()

            }, 300);
        }
        let fileContext = state.openedFileContext[state.currentFocusContext.targetString]

        if (fileContext.hasChange) {
            setGlobalMessageBox(true)
            let result = await new Promise((resolve, reject) => {
                let a = setInterval(() => {
                    // console.log("循环中等待")
                    if (sign.current == 'save') {
                        save()
                        clearInterval(a)
                        resolve(true)
                    }
                    else if (sign.current == 'close') {
                        clearInterval(a)
                        resolve(true)
                    }
                    else if (sign.current == 'cancel') {
                        clearInterval(a)
                        resolve(false)
                    }
                }, 100);
            })
            // console.log(result)
            if (result) {
                handle()
            }
            return
        }
        handle()
    }

    //顶栏中选中文件
    let showFile = (target) => {
        let list = copy(topBar)
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
        let handle = findHandle(target.wholePath)
        store.dispatch({
            type: 'currentFocus',
            data: {
                currentHandle: handle,
                targetString: target.wholePath
            }
        })

        for (let i of a) {
            // console.log(i)
            if (!foldState[i + dirSuffix]) {
                // console.log("找到false")
                changeChosenBackgroundColorAndFoldState(i + dirSuffix, true)
                return
            }
        }
        changeChosenBackgroundColorAndFoldState(target.path + "/" + target.name + fileSuffix)


    }



    useEffect(() => {
        //监听侧栏右侧边界
        //定义模糊半径
        let blurRadius = getComputedStyle(document.documentElement).getPropertyValue("--right-border-width").split("px")[0] * 1
        // console.log(blurRadius)
        //范围修正
        let rangeAmend = 3

        let clickObserve = (e) => {
            let position = leftBarDom.current.style.width.split("px")[0] * 1 + 5
            if (e.clientX >= position - blurRadius + rangeAmend && e.clientX <= position + blurRadius + rangeAmend) {
                // console.log(e.clientX,position - blurRadius + rangeAmend,position + blurRadius + rangeAmend)
                const startX = e.clientX;
                // console.log("startX:",e.clientX)
                let moveObserve = (e) => {
                    let moveX = e.clientX - startX
                    if (position + moveX > 130 && position + moveX < 300) {
                        // console.log("@@",leftBarWidth,moveX)
                        setLeftBarWidth(position - 5 + moveX)
                        // flushSync()
                    }
                }
                window.addEventListener('mousemove', moveObserve)
                let removeObserve = () => {
                    window.removeEventListener('mousemove', moveObserve)
                    window.removeEventListener('mouseup', removeObserve)
                    //因为要改变鼠标样式的监听里面的leftBarWidth依旧是上次的，不会更新，因此，需要手动重新加载一下监听函数
                }
                window.addEventListener('mouseup', removeObserve)
            }
        }
        window.addEventListener('mousedown', clickObserve)
        return () => {

            window.removeEventListener('mousedown', clickObserve)
        }
    }, [])
    // let observerRightBorderOfLeftBarForMove=()=>{

    // }
    // observerRightBorderOfLeftBarForMove()
    let leftBarDom = useRef(null)
    let topBarDom = useRef(null)
    let createFileDom = (path, node, index) => {
        //生成文件Dom树
        path = path === '/' ? '' : path
        // console.log(fileTree)
        return node.map(j => {
            return Object.keys(j).map(i => {
                if (!(j[i] instanceof Array)) {
                    return (
                        <div key={path + "/" + i}>
                            {/* 注意，这里外面的一层div不能和下面的合并，这是为了和文件夹的结构对应，不然统一处理的时候会出问题 */}
                            <div title={!path ? currentDirHandle.name + "/" + i : currentDirHandle.name + path + "/" + i} className={`${style.border} ${style.file}`}
                                style={{ width: `${leftBarWidth - 2}px`, display: "flex" }} ref={Refs.current[path + "/" + i + fileSuffix]}
                                onClick={() => { changeChosenBackgroundColorAndFoldState(path + "/" + i + fileSuffix); openFile({ name: i, path: path, wholePath: path + "/" + i + fileSuffix }) }}>
                                {/* {console.log(Refs.current)} */}
                                <span style={{ width: "90%", transform: `translateX(${gap * (index)}px)`, display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                                    <FileImg fileType={i.split(".")[i.split(".").length - 1]}></FileImg>{i}</span>
                            </div>
                        </div>
                    )
                } else {
                    return (
                        <div key={path + "/" + i} style={{ display: "flex", width: "100%" }}>
                            <div title={currentDirHandle.name + path + "/" + i} className={`${style.border}`} style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                                <div className={style.dir} style={{ width: "100%", display: "flex" }} ref={Refs.current[path + "/" + i + dirSuffix]} onClick={() => changeChosenBackgroundColorAndFoldState(path + "/" + i + dirSuffix)}>
                                    <span style={{ width: "min-content", transform: `translateX(${gap * index}px)`, display: "flex", flexDirection: "row", alignItems: "center" }}>
                                        <img src={foldState[path + "/" + i + dirSuffix] ? downArrow : rightArrow} alt="右箭头" className={style.label} />
                                        <DirImg></DirImg>
                                        {i}
                                    </span>
                                </div>
                                <div className={`${style.border}  ${style.heightTransition}`} style={{ width: "100%", height: "0" }}>
                                    {/* 高度初始化为0就是默认不展开 */}
                                    {createFileDom(path + "/" + i, j[i], index + 1)}
                                </div>
                            </div>
                        </div>
                    )
                }
            })

        })
    }

    return (
        <div>
            {/* 全局消息确认框 */}
            {globalMessageBox ? (<div style={{ position: 'absolute', left: '0', top: "0", width: '100%', height: "100%", zIndex: 999, }}>
                <div style={{
                    left: 0, right: 0, top: 0, bottom: 0, margin: 'auto auto', position: 'absolute', width: "300px", height: "182px", backgroundColor: "white", borderRadius: "48px",
                    border: "1px solid black",
                    display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 1000,
                    padding: "10px 30px"
                }}>
                    <div style={{ transform: "translateY(-30px)", fontSize: "30px", fontFamily: "楷书", fontWeight: 300, textAlign: "center" }} >文件已修改，是否保存?</div>
                    <div style={{ display: "flex", justifyContent: "space-evenly", width: "100%" }}>
                        <Button onClick={() => { sign.current = 'save'; setGlobalMessageBox(false) }} style={{}} type="primary">保存</Button>
                        <Button onClick={() => { sign.current = 'cancel'; setGlobalMessageBox(false) }} style={{}} type="primary">取消</Button>
                        <Button type="primary" onClick={() => { sign.current = 'close'; setGlobalMessageBox(false) }}>不保存</Button>
                    </div>

                </div>
                <div style={{ position: 'absolute', backgroundColor: "#fafafa", width: '100%', height: "100%", zIndex: 999, opacity: 0.6 }}></div>
            </div>) : null}
            {/* 侧栏 */}
            <div className={style.leftBar} id="leftBar" style={{ display: "flex", flexDirection: "column", width: `${leftBarWidth}px`, left: "5px" }} ref={leftBarDom}>
                <div style={{ width: "100%", height: "20px", display: "flex", justifyContent: "flex-end" }}>
                    <Button size="small" icon={<FolderAddOutlined />} src="/FileImg/file.svg" alt="新增文件" className={style.choice} />
                    <Button size="small" icon={<FileAddOutlined />} src="/dir.svg" alt="新增文件夹" className={style.choice} />
                    <Button size="small" icon={<DeleteOutlined />} src="/delete.svg" alt="删除" className={style.choice} />
                    <Button size="small" icon={<UndoOutlined />} src="/refresh.svg" style={{ marginTop: "0px" }} alt="刷新" className={style.choice} onClick={() => { closeDir(true); openDir(currentDirHandle) }} />
                </div>
                <div style={{ display: "flex", transform: "translateY(5px)" }} className="dir-wrapper">
                    {currentDirHandle ? (<div className={`${style.border}`} style={{ display: "flex", flexDirection: "column", width: `100%` }}>
                        <div className={style.dir} style={{ width: "100%", display: "flex" }} ref={Refs.current["/"]} onClick={() => changeChosenBackgroundColorAndFoldState('/')}>
                            <span style={{ width: "90%", display: "flex", flexDirection: "row", alignItems: "center", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                <img src={foldState['/'] ? downArrow : rightArrow} alt="箭头" className={style.label} />

                                <DirImg></DirImg>
                                {currentDirHandle.name}
                            </span>
                        </div>
                        <div className={`${style.border} ${style.heightTransition}`} style={{ width: "100%" }}>
                            <div >{createFileDom('/', showedFile, 1)}</div>
                        </div>
                    </div>) : null}
                </div>

            </div>
            {/* 侧栏底部 */}
            <div>

                {!isOpen ? (<Button onClick={() => openDir()} size="large" loading={loading}
                    icon={<FolderOpenTwoTone />}
                    className={style.button_hover}
                    style={{
                        position: 'absolute', top: `${2 + leftBarDom.current?.getBoundingClientRect().height * 1}px`,
                        left: `${0 + leftBarDom.current?.getBoundingClientRect().left * 1}px`,
                        background: "linear-gradient(145deg, #d9d2d2, #fff9f9)",
                        boxShadow: " 20px 20px 60px #cdc6c6,-20px -20px 60px #ffffff"
                    }}>

                </Button>) : (<Button onClick={() => closeDir(false)} size="large"
                    icon={<CloseDir />}
                    className={style.button_hover}
                    style={{
                        position: 'absolute', top: `${2 + leftBarDom.current?.getBoundingClientRect().height * 1}px`,
                        left: `${0 + leftBarDom.current?.getBoundingClientRect().left * 1}px`,
                        background: "linear-gradient(145deg, #d9d2d2, #fff9f9)",
                        boxShadow: " 20px 20px 60px #cdc6c6,-20px -20px 60px #ffffff"
                    }}>

                </Button>)}

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
                            <div key={item.path + '/' + item.name} title={currentDirHandle.name + item.path + '/' + item.name}
                                className={`${style.filelabel} ${item.active ? style.active : null}  animate__animated animate__bounce  animate__fadeInBottomLeft animate__faster  `}
                                style={{ display: "flex", alignItems: "center", position: "relative", whiteSpace: "nowrap" }}
                                onClick={() => showFile({ name: item.name, path: item.path, wholePath: item.path + '/' + item.name + fileSuffix })}>
                                <FileImg fileType={item.name.split(".")[item.name.split(".").length - 1]}></FileImg>
                                <span style={{ width: "96px", textOverflow: "ellipsis", overflow: "hidden" }}> {item.name} </span>
                                {(() => {
                                    let file = findFile(item.path + '/' + item.name + fileSuffix)
                                    if (file && file.hasChange) {
                                        return <Dot className={`${style.close_img_hover}`} style={{
                                            position: "absolute", right: "2px", width: "20px", zIndex: "1",
                                            borderRadius: "20%"
                                        }} onClick={(e) => { e.stopPropagation(); closeFile({ path: item.path, name: item.name, wholePath: item.path + '/' + item.name + fileSuffix }, e) }}></Dot>
                                    }
                                    return <img className={`${style.close_img_hover}`} src="/remove.svg" alt="关闭"
                                        style={{ position: "absolute", right: "2px", width: "20px", zIndex: "1", borderRadius: "20%" }}
                                        onClick={(e) => { e.stopPropagation(); closeFile({ path: item.path, name: item.name, wholePath: item.path + '/' + item.name + fileSuffix }, e) }} />
                                })()}

                            </div>
                        )
                    })
                }
                {/* <div className={style.filelabel} style={{ display: "flex", alignItems: "center",position:"relative",whiteSpace:"nowrap" }}><FileImg fileType="js" >
                </FileImg><span style={{width:"96px",textOverflow:"ellipsis",overflow:"hidden"}}>文件142141241241 </span> <img src="/remove.svg" alt="删除"  style={{position:"absolute",right:"0",width:"20px"}} /></div>
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
