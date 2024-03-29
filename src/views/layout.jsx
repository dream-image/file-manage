import React, { useRef, useState } from "react"
import style from "./style.module.css"

import style_from_demo from '../index.module.css'
import debounce from "../utils/debounce"
import rightArrow from "/right1.svg"
import downArrow from "/down1.svg"
import DirImg from "../components/DirImg"
import FileImg from "../components/FileImg"
import CloseDir from "../components/CloseDir"
import Dot from "../components/Dot"
import ConfigCard from "../components/configCard/ConfigCard"
import CheckBox from "../components/configCard/CheckBox"
import ConfigInput from "../components/configCard/Input"
import Menu from "../components/Menu/Menu"
import MenuItem from "../components/Menu/MenuItem"
import { useEffect } from "react"
import 'animate.css';
import { flushSync, createPortal } from "react-dom"
import { useContext } from "react"
import Context from "../contexts/Context"
import { copy } from "../utils/copyObject"
import { handlePropertyName } from "../utils/symbols"
import { Button, notification, Space, Modal, message, Input, Spin } from 'antd'
import {
    FolderOpenTwoTone, UndoOutlined,
    DeleteOutlined, FolderAddOutlined,
    FileAddOutlined, SettingTwoTone,
    WarningTwoTone, SwitcherOutlined
} from '@ant-design/icons'


//构建文件Dom节点列表的时候，结尾加上后缀来区分是文件还是文件夹
const fileSuffix = '#file'
const dirSuffix = '#dir'
// 对于浏览器识别不出来的文件类型，这里手动加入
const typeObj = {
    cjs: "javascript",
    ts: "typescript",
    js: "javascript",
    "svg+xml": "xml"
}

const currentPath = {
    type: "",
    wholePath: "",
    handle: undefined
}
let newType
export default function Layout({ children }) {
    const store = useContext(Context)
    const [state, setState] = useState(store.getState())
    const [isNewFile, setIsNewFile] = useState(false)
    const leftBarContextmenuChosenHandle = useRef()
    let [leftBarWidth, setLeftBarWidth] = useState(130)//左侧栏的默认宽度
    const currentDirHandleRef = useRef() //这个就是为了解决监听事件里面获取的当前文件夹的handle为null
    useEffect(() => {
        let unsubscribe = store.subscribe(() => {
            let value = store.getState()
            setState(value)
            // console.log(JSON.stringify(value.config) )
            localStorage.setItem('config', JSON.stringify(value.config))
        })
        let config = localStorage.getItem('config')
        // console.log(config)
        let x = localStorage.getItem('leftBarWidth')
        if (x) {
            x = x * 1
            // console.log(x)
            setLeftBarWidth(x)
        }

        if (config && (config = JSON.parse(config)))
            store.dispatch({
                type: "config",
                config: { ...config }
            })
        return () => {
            unsubscribe()
        }
    }, [])


    let [loading, setLoading] = useState(false) //打开文件的加载状态
    let [isOpen, setIsOpen] = useState(false)//是否已打开文件
    let [currentDirHandle, setCurrentDirHandle] = useState(null)//当前目录的句柄
    let [isShowSetting, setIsShowSetting] = useState(false)//是否显示设置
    let [isSaveAllFile, setIsSaveAllFile] = useState(false)//是否保存所有文件
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
        // console.log(tree)
        if (model === 'inverse') {
            function goto(path, node, index, showNode) {
                let index2 = 0;
                // console.log(node)
                // console.log("showNode:",showNode)
                for (let i of node) {
                    let name = Object.keys(i)[0]
                    // console.log(name,path,index)
                    if (i[name] instanceof Array && name === path[index]) {
                        if (index < path.length - 1)
                            return goto(path, i[name].sort(sort), index + 1, showNode[index2][name])
                        if (!value) {
                            // showNode[index2][name].splice(0, showNode[index2][name].length)
                        }
                        else {
                            // console.log("showNode[index2]:",showNode[index2])
                            if (!showNode[index2][name] || showNode[index2][name].length == 0) {
                                // console.log("添加节点数据")
                                showNode[index2][name] = [...copy(shallowFile(i[name]).sort(sort))]
                                // console.log("添加完毕")
                                // console.log("@showNode[index2]@:",showNode[index2])
                                return true
                            }
                        }
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
                // console.log(tree)
                Refs.current = {}
                Refs.current['/'] = React.createRef()
                initDomRefs('/', tree, Refs)
                setShowedFile(tree)
                // flushSync()
            }
        }
    }
    let changeChosenBackgroundColorAndFoldState = (target, onlyHighLight = false, changeState = true) => {
        currentPath.wholePath = target
        // console.log(currentPath)
        if (!onlyHighLight && (new RegExp(dirSuffix).test(target) || target === '/')) {
            setFoldState({ ...foldState, [target]: !foldState[target] })
            changeFoldState("inverse", target, !foldState[target])
            currentPath.type = "dir"
        }
        setTimeout(() => {
            Object.keys(Refs.current).forEach(i => {

                if (Refs.current[i].current)
                    Refs.current[i].current.className = `${style.dir}`
                if (i === target) {

                    Refs.current[i].current.className = `${style.dir} ${style.dir_active}`
                    if (changeState && new RegExp(fileSuffix).test(target)) {
                        store.dispatch({
                            type: 'currentFocus',
                            data: {
                                type: "file",
                                targetString: target
                            }
                        })
                        currentPath.type = "file"
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
    function findHandle(wholePath, type = 'file') {
        // console.log(wholePath)
        let path = wholePath.split('/')
        // console.log(path)
        path.shift()
        if (path.length === 1 && path[0] === '') {
            return currentDirHandleRef.current
        }
        path[path.length - 1] = path[path.length - 1].split('#')[0]
        // console.log(path)
        function find(path, handle, index) {
            if (handle.kind === 'file') {
                return handle
            }
            if (path.length == index - 1) {
                return handle
            }
            if (type === 'dir' && path.length == index) {
                return handle
            }
            for (let i of handle.children) {
                if (i.name === path[index]) {
                    return find(path, i, index + 1)
                }

            }
        }
        return find(path, currentDirHandleRef.current, 0)
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
            currentDirHandleRef.current = rootHandle
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
            currentPath.type = 'dir'
            currentPath.wholePath = '/'
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
            currentDirHandleRef.current = null
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
                let type
                if (!file.type) {
                    type = file.name.split(".")[file.name.split(".").length - 1]
                } else {
                    type = file.type.split("/")
                    type = type[type.length - 1]
                }
                // console.log(type)
                store.dispatch({
                    type: 'openedFile',
                    data: {
                        [target.wholePath]: {
                            handle: handle,
                            hasChange: false,
                            copyContext: e.target.result,
                            originContext: e.target.result,
                            type: typeObj[type] ? typeObj[type] : type
                        }
                    }
                })
                store.dispatch({
                    type: 'currentFocus',
                    data: {
                        currentHandle: handle,
                        targetString: target.wholePath,
                        type: "file"
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
                    targetString: target.wholePath,
                    type: "file"
                }
            })
        }

        // console.log(handle, target.wholePath)

    }
    const [globalMessageBox, setGlobalMessageBox] = useState(false)

    //关闭文件
    let sign = useRef()
    let closeFile = async (target, e) => {
        // console.log(target)
        // console.log("关闭")
        sign.current = ''
        let save = () => {
            try {
                (async () => {
                    let writable = await state.currentFocusContext.currentHandle.createWritable();
                    // console.log(state.currentFocusContext.currentHandle)
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
                if (state.currentFocusContext.targetString != target.wholePath) {
                    list.splice(index, 1)
                    // console.log(list)
                    if (index != -1)
                        setTopBar([...list])
                    return
                }
                list[index].active = false
                // console.log(index)
                if (index > 0) {
                    list[index - 1].active = true
                    changeChosenBackgroundColorAndFoldState(list[index - 1].wholePath, true, false)
                }
                else {
                    if (list[1]) {
                        list[1].active = true
                        changeChosenBackgroundColorAndFoldState(list[1].wholePath, true, false)
                    }
                }

                list.splice(index, 1)
                // console.log(list)
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
                currentPath.type = "file"
                currentPath.wholePath = target.path + "/" + target.name + fileSuffix
                return
            }
        }
        changeChosenBackgroundColorAndFoldState(target.path + "/" + target.name + fileSuffix)

        currentPath.type = "file"
        currentPath.wholePath = target.path + "/" + target.name + fileSuffix
    }
    let [fileName, setFileName] = useState("")

    //存放是否新建确认新建文件(夹)处理的对象
    let newFileHandleObj = {
        sureNewFile: async (type) => {
            // console.log(type)
            // console.log(currentPath)

            try {
                let path = []
                if (currentPath.type === "file") {
                    path = currentPath.wholePath.split("/").slice(1, -1)
                } else {
                    path = currentPath.wholePath.split("/").slice(1)
                    path[path.length - 1] = path[path.length - 1].split(dirSuffix)[0]
                }
                function findHandle(path, handle, index) {
                    if (index === path.length) {
                        return handle
                    }
                    for (let i of handle.children) {
                        if (i.name === path[index]) {
                            return findHandle(path, i, index + 1)
                        }
                    }
                }
                let handle
                let tree
                let node
                if (path.length == 1 && path[0] == "") {
                    handle = currentDirHandle
                    node = [...fileTree]
                    if (type == 'file') {
                        for (let i of node) {
                            let name = Object.keys(i)[0]
                            if (name === fileName && i[name] instanceof String) {
                                message.error({
                                    content: "文件名重复",
                                })
                                return
                            }
                        }
                        let file = await handle.getFileHandle(fileName, { create: true })
                        handle.children.push(file)
                        node.push({ [fileName]: "file" })
                        tree = [...showedFile]
                        node = tree
                        node.push({ [fileName]: "file" })
                    }
                    else {
                        for (let i of node) {
                            let name = Object.keys(i)[0]
                            if (name === fileName && i[name] instanceof Array) {
                                message.error({
                                    content: "文件夹名重复",
                                })
                                return
                            }
                        }
                        let file = await handle.getDirectoryHandle(fileName, { create: true })
                        handle.children.push(file)
                        node.push({ [fileName]: [] })
                        tree = [...showedFile]
                        node = tree
                        node.push({ [fileName]: [] })
                    }
                    tree.sort(sort)
                    Refs.current = {}
                    Refs.current['/'] = React.createRef()
                    initDomRefs('/', tree, Refs)
                    setFileTree(tree)
                    setShowedFile(tree)
                    setIsNewFile(false)
                    setFileName("")
                    // console.log(currentDirHandle)
                    return
                }
                handle = findHandle(path, currentDirHandle, 0)
                function findNode(path, node, index) {
                    if (index === path.length) {
                        return node
                    }
                    // console.log(node)
                    for (let i of node) {
                        let name = Object.keys(i)[0]
                        if (name === path[index] && i[name] instanceof Array) {
                            return findNode(path, i[name], index + 1)
                        }
                    }
                }

                tree = [...fileTree]
                node = findNode(path, tree, 0)
                if (type === 'file') {
                    for (let i of node) {
                        let name = Object.keys(i)[0]
                        if (name === fileName && i[name] instanceof String) {
                            message.error({
                                content: "文件名重复",
                            })
                            return
                        }
                    }
                    let file = await handle.getFileHandle(fileName, { create: true })
                    if (!handle.children) {
                        handle.children = []
                    }
                    handle.children.push(file)

                    node.push({ [fileName]: "file" })
                    tree = [...showedFile]
                    node = findNode(path, tree, 0)
                    node.push({ [fileName]: "file" })
                }
                else {
                    for (let i of node) {
                        let name = Object.keys(i)[0]
                        if (name === fileName && i[name] instanceof Array) {
                            message.error({
                                content: "文件夹名重复",
                            })
                            return
                        }
                    }
                    let file = await handle.getDirectoryHandle(fileName, { create: true })
                    handle.children.push(file)
                    node.push({ [fileName]: [] })
                    tree = [...showedFile]
                    node = findNode(path, tree, 0)
                    node.push({ [fileName]: [] })

                }
                setFileName("")
                tree.sort(sort)
                Refs.current = {}
                Refs.current['/'] = React.createRef()
                initDomRefs('/', tree, Refs)
                setFileTree(tree)
                setShowedFile(tree)
                setIsNewFile(false)
            } catch (error) {
                let errorMessage
                console.log(error)
                switch (error.name) {
                    case 'TypeError':
                        errorMessage = '名称不规范'
                        break;
                    case 'NotAllowedError':
                        errorMessage = '请允许修改'
                        break;
                    default:
                        errorMessage = error
                        break;
                }
                message.error({
                    content: errorMessage
                })
            }

        },
        cancelNewFile: () => {
            setIsNewFile(false)
            setFileName("")
        }
    }
    let inputDom = useRef()

    //新建(夹)弹出框
    let confirmBox = (e, type) => {
        if (!currentPath.wholePath) {
            message.warning({
                content: '请先打开文件夹',
                duration: "3"
            });
            return
        }
        newType = type
        setIsNewFile(true)
        setTimeout(() => {
            inputDom.current.focus()
        }, 300);



    }

    let folderAllFile = () => {
        let state = { ...foldState }
        // console.log(foldState)
        let brotherDom
        // console.log(Refs.current)
        Object.keys(state).forEach(i => {
            if (i === '/')
                return
            // console.log(i)
            state[i] = false
            brotherDom = Refs.current[i]?.current.parentNode.children[1]
            brotherDom?.style && (brotherDom.style.height = 0)
        })
        setFoldState(state)
    }
    //删除文件(夹)
    let deleteFile = (e, type) => {


    }

    let [settingOutAnimate, setSettingOutAnimate] = useState('')
    let settingButton = useRef(null)
    let settingMenu = useRef(null)

    //点击其他地方关闭设置
    let observe = (e) => {
        // console.log('见识到')
        // console.log(setting)
        if (!settingMenu.current.contains(e.target) && !settingButton.current.contains(e.target)) {
            openSetting(false)
        }
    }

    //开关设置
    let openSetting = (open = true) => {

        // console.log(isShowSetting)
        if (!open) {
            // console.log("一打开")
            setSettingOutAnimate('animate__zoomOut')
            document.removeEventListener('click', observe)
            setTimeout(() => {
                setIsShowSetting(false)
            }, 300);
        } else {
            // console.log("未打开")
            setTimeout(() => {
                document.addEventListener('click', observe)
            }, 300);
            setSettingOutAnimate('')
            setIsShowSetting(true)

        }
    }

    //保存所有文件
    let saveAllFile = () => {
        let obj = state.openedFileContext
        let handle
        Object.keys(obj).forEach(async key => {
            handle = obj[key].handle
            if (!handle)
                return
            let writable = await handle.createWritable()
            await writable.write(obj[key].copyContext)
            await writable.close()
        })
    }



    //是否显示左侧栏
    let changeLeftBarState = () => {
        if (leftBarWidth > 0) {
            setLeftBarWidth(0)
        } else {
            let x = localStorage.getItem('leftBarWidth')
            setLeftBarWidth(x ? x * 1 : 130)
        }
    }
    useEffect(() => {
        //监听侧栏右侧边界
        //定义模糊半径
        let blurRadius = getComputedStyle(document.documentElement).getPropertyValue("--right-border-width").split("px")[0] * 1
        // console.log(blurRadius)
        //范围修正
        let rangeAmend = 3
        if ((leftBarWidth >= 295 || leftBarWidth <= 130) && state.config.hasMaxOfLeftBarWidth) {
            if (leftBarWidth >= 295) {
                setLeftBarWidth(295)
                localStorage.setItem('leftBarWidth', 295)
            } else {
                setLeftBarWidth(130)
                localStorage.setItem('leftBarWidth', 130)
            }

        }
        let clickObserve = (e) => {
            // console.log('点击时间')
            let position = leftBarDom.current.style.width.split("px")[0] * 1 + 5
            if (e.clientX >= position - blurRadius + rangeAmend && e.clientX <= position + blurRadius + rangeAmend) {
                // console.log(e.clientX,position - blurRadius + rangeAmend,position + blurRadius + rangeAmend)
                const startX = e.clientX;
                // console.log("startX:",e.clientX)
                let set = debounce((value) => {
                    localStorage.setItem('leftBarWidth', value)
                })
                let moveObserve = (e) => {
                    // console.log("移动事件")
                    let moveX = e.clientX - startX
                    // console.log(position + moveX)
                    if ((position + moveX > 130) && (state.config.hasMaxOfLeftBarWidth ? position + moveX < 300 : true)) {
                        // console.log("@@",leftBarWidth,moveX)
                        setLeftBarWidth(position - 5 + moveX)
                        // flushSync()
                        set(position - 5 + moveX)
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
    }, [state.config])
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
                        <div key={path + "/" + i} data-path={path + "/" + i + fileSuffix}>
                            {/* 注意，这里外面的一层div不能和下面的合并，这是为了和文件夹的结构对应，不然统一处理的时候会出问题 */}
                            <div title={!path ? currentDirHandle.name + "/" + i : currentDirHandle.name + path + "/" + i} className={`${style.border} ${style.file}`}
                                style={{ width: `${leftBarWidth - 2}px`, display: "flex" }} ref={Refs.current[path + "/" + i + fileSuffix]}
                                onClick={() => { changeChosenBackgroundColorAndFoldState(path + "/" + i + fileSuffix); openFile({ name: i, path: path, wholePath: path + "/" + i + fileSuffix }) }}>
                                {/* {console.log(Refs.current)} */}
                                <span data-type='file' style={{ width: "90%", transform: `translateX(${state.config.gap * (index)}px)`, display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                                    <FileImg type='file' fileType={i.split(".")[i.split(".").length - 1]}></FileImg>{i}</span>
                            </div>
                        </div>
                    )
                } else {
                    return (
                        <div key={path + "/" + i} data-path={path + "/" + i + dirSuffix} style={{ display: "flex", width: "100%" }}>
                            <div title={currentDirHandle.name + path + "/" + i} className={`${style.border}`} style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                                <div className={style.dir} data-type='dir' style={{ width: "100%", display: "flex" }} ref={Refs.current[path + "/" + i + dirSuffix]} onClick={() => changeChosenBackgroundColorAndFoldState(path + "/" + i + dirSuffix)}>
                                    <span data-type='dir' style={{ width: "max-content", transform: `translateX(${state.config.gap * index}px)`, display: "flex", flexDirection: "row", alignItems: "center", whiteSpace: "nowrap" }}>
                                        <img data-type='dir' src={foldState[path + "/" + i + dirSuffix] ? downArrow : rightArrow} alt="右箭头" className={style.label} />
                                        <DirImg type='dir'></DirImg>
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
    let [viewWidth, setViewWidth] = useState(leftBarWidth)
    const ob = new ResizeObserver(debounce((entries) => {
        setViewWidth(document.body.getBoundingClientRect().width)
    }, 100))

    let [leftBarMenuInfo, setLeftBarMenuInfo] = useState({
        active: false,
        x: 0,
        y: 0,
    })
    let leftBarMenuInfoRef = useRef(leftBarMenuInfo)
    leftBarMenuInfoRef.current = leftBarMenuInfo
    let leftBarMenuDom = useRef()
    const [leftBarMenuListNode, setLeftBarMenuListNode] = useState()
    const chosenList = useRef()

    const maskInnerDom = useRef(null)
    let leftBarMenuHandle = (e) => {
        e.preventDefault()
        // console.log(e.target)
        if (topBarMenuInfoRef.current.active) {
            setTopBarMenuInfo({ active: false, x: 0, y: 0 })
        }
        if (e.target?.id === 'leftBar')
            return
        if (loading || !currentDirHandleRef.current)
            return
        setLeftBarMenuInfo({
            active: true,
            x: e.clientX,
            y: e.clientY
        })
        if (e.target.dataset.type === 'file') {
            setLeftBarMenuListNode((
                <Menu style={{ left: e.clientX, top: e.clientY, width: "170px" }} ref={leftBarMenuDom}>
                    <MenuItem>删除文件</MenuItem>
                    <MenuItem>重命名</MenuItem>
                </Menu>
            ))
        } else {
            setLeftBarMenuListNode((
                <Menu style={{ left: e.clientX, top: e.clientY, width: "170px" }} ref={leftBarMenuDom}>
                    <MenuItem>新建文件</MenuItem>
                    <MenuItem>新建文件夹</MenuItem>
                    <MenuItem>删除文件夹</MenuItem>
                    <MenuItem rightText="F2">重命名</MenuItem>
                </Menu>
            ))
        }
        let handle
        if (e.target.nodeName === 'SPAN') {
            if (e.target.dataset.type === 'file') {
                // console.log(e.target.parentNode.parentNode.dataset.path)
                handle = findHandle(e.target.parentNode.parentNode.dataset.path)
                if (chosenList.current) {
                    chosenList.current?.className && (chosenList.current.className = chosenList.current.className.replace(style.chosen_menu, ""))
                }
                e.target.parentNode.className += " " + style.chosen_menu + " "
                chosenList.current = e.target.parentNode
            } else if (e.target.dataset.type === 'dir') {
                handle = findHandle(e.target.parentNode.parentNode.parentNode.dataset.path, 'dir')
                if (chosenList.current) {
                    chosenList.current?.className && (chosenList.current.className = chosenList.current.className.replace(style.chosen_menu, ""))
                }
                e.target.parentNode.className += " " + style.chosen_menu + " "
                chosenList.current = e.target.parentNode
            }
            // console.log(e.target.parrentNode.id)
        } else if (e.target.nodeName === 'IMG') {
            if (e.target.dataset.type === 'file') {
                handle = findHandle(e.target.parentNode.parentNode.parentNode.dataset.path)
                if (chosenList.current) {
                    chosenList.current?.className && (chosenList.current.className = chosenList.current.className.replace(style.chosen_menu, ""))
                }
                e.target.parentNode.parentNode.className += " " + style.chosen_menu + " "
                chosenList.current = e.target.parentNode.parentNode
            } else if (e.target.dataset.type === 'dir') {
                handle = findHandle(e.target.parentNode.parentNode.parentNode.parentNode.dataset.path, 'dir')
                if (chosenList.current) {
                    chosenList.current?.className && (chosenList.current.className = chosenList.current.className.replace(style.chosen_menu, ""))
                }
                e.target.parentNode.parentNode.className += " " + style.chosen_menu + " "
                chosenList.current = e.target.parentNode.parentNode
            }
        }
        else if (e.target.nodeName === 'DIV') {
            // console.log( maskInnerDom.current)
            if (maskInnerDom.current && e.target.contains(maskInnerDom.current) || ['mask', 'ant-spin', 'ant-spin-text'].some(i => {
                return e.target.className.includes(i)
            })) {
                return
            }
            // console.log(e.target)
            handle = findHandle(e.target.parentNode.parentNode.dataset.path, 'dir')

            if (chosenList.current) {
                chosenList.current?.className && (chosenList.current.className = chosenList.current.className.replace(style.chosen_menu, ""))
            }
            e.target.className += " " + style.chosen_menu + " "
            chosenList.current = e.target
        }
        leftBarContextmenuChosenHandle.current = handle

    }

    let [topBarMenuInfo, setTopBarMenuInfo] = useState({
        active: false,
        x: 0,
        y: 0,
    })
    let topBarMenuInfoRef = useRef(topBarMenuInfo)
    topBarMenuInfoRef.current = topBarMenuInfo
    let topBarMenuDom = useRef()
    let topBarMenuHandle = (e) => {
        e.preventDefault()
        // console.log(e.target)
        if (leftBarMenuInfoRef.current.active) {
            setLeftBarMenuInfo({ active: false, x: 0, y: 0 })
        }
        setTopBarMenuInfo({
            active: true,
            x: e.clientX,
            y: e.clientY
        })

    }
    let closeMenu = (e) => {
        if (leftBarMenuInfoRef.current.active) {
            // console.log('@')
            setLeftBarMenuInfo({ x: 0, y: 0, active: false })
        }
        if (topBarMenuInfoRef.current.active) {
            setTopBarMenuInfo({ x: 0, y: 0, active: false })
        }
    }
    useEffect(() => {
        ob.observe(document.body)
        let handleClick = (e) => {
            // console.log(e)
            if (chosenList.current) {
                chosenList.current?.className && (chosenList.current.className = chosenList.current.className.replace(style.chosen_menu, ""))
                chosenList.current = undefined
            }
            if (e.target.id === 'leftBar') {
                Object.keys(Refs.current).forEach(i => {
                    if (Refs.current[i].current)
                        Refs.current[i].current.className = `${style.dir}`
                })
                if (currentPath.wholePath) {
                    currentPath.type = 'dir'
                    currentPath.wholePath = "/"
                }

            }


        }
        leftBarDom.current.addEventListener('click', handleClick)
        leftBarDom.current.addEventListener('contextmenu', leftBarMenuHandle)

        document.addEventListener('click', closeMenu)
        topBarDom.current.addEventListener('contextmenu', topBarMenuHandle)

        return () => {
            ob.disconnect()
            leftBarDom.current.removeEventListener('click', handleClick)
            leftBarDom.current.removeEventListener('contextmenu', leftBarMenuHandle)
            topBarDom.current.removeEventListener('contextmenu', topBarMenuHandle)
            document.removeEventListener('click', closeMenu)
        }
    }, [])
    // document.oncontextmenu = function(e){
    //     return false
    //     //或者 e.preventDefault()
    // }
    return (
        <div>
            {/* 右键侧栏显示菜单 */}
            {
                leftBarMenuInfo.active ? (
                    createPortal(leftBarMenuListNode, document.body)) : null
            }
            {/* 顶栏菜单 */}
            {
                topBarMenuInfo.active ? (
                    createPortal(<Menu style={{ left: topBarMenuInfo.x, top: topBarMenuInfo.y }} ref={topBarMenuDom}>
                        <MenuItem>顶部子节点</MenuItem>
                        <MenuItem>顶部子节点2</MenuItem>
                    </Menu>, document.body)) : null
            }

            {/* 全局消息确认框 */}
            {globalMessageBox ? (<div style={{ position: 'absolute', left: '0', top: "0", width: '100%', height: "100%", zIndex: 999, }}>
                <div style={{
                    left: 0, right: 0, top: 0, bottom: 0, margin: 'auto auto', position: 'absolute', width: "300px", height: "152px", backgroundColor: "#ffffff", borderRadius: "16px",
                    border: "1px solid white",
                    display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignItems: "center", zIndex: 1000,
                    padding: "10px 30px", color: "rgba(0,0,0,0.88)",
                    boxShadow: "0 6px 16px 0 rgba(0, 0, 0, 0.08),0 3px 6px -4px rgba(0, 0, 0, 0.12),0 9px 28px 8px rgba(0, 0, 0, 0.05)"
                }}>
                    <div style={{
                        fontSize: "20px",
                        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji'",
                        fontWeight: 300, textAlign: "center"
                    }} ><WarningTwoTone twoToneColor="#faad14" style={{ marginRight: "5px" }} />文件已修改，是否保存?</div>
                    <div style={{ display: "flex", justifyContent: "space-evenly", width: "100%", height: "50px", alignItems: "center" }}>
                        <Button onClick={() => { sign.current = 'close'; setGlobalMessageBox(false) }} size="large" type="primary">不保存</Button>
                        <Button onClick={() => { sign.current = 'save'; setGlobalMessageBox(false) }} size="large" type="primary">保存</Button>
                        <Button onClick={() => { sign.current = 'cancel'; setGlobalMessageBox(false) }} size="large" >取消</Button>

                    </div>

                </div>
                <div style={{ position: 'absolute', backgroundColor: "rgba(0, 0, 0, 0.45)", width: '100%', height: "100%", zIndex: 999, opacity: 0.6 }}></div>
            </div>) : null}

            {/* 新增文件交互 */}
            <>
                <Modal title={`新增文件${newType == 'dir' ? '夹' : ''}`} open={isNewFile} onOk={() => newFileHandleObj.sureNewFile(newType)} okText="确认" cancelText="取消" onCancel={() => newFileHandleObj.cancelNewFile()}>
                    <Input placeholder={`请输入文件${newType == 'dir' ? '夹' : ''}名`} ref={inputDom} value={fileName} onPressEnter={() => newFileHandleObj.sureNewFile(newType)} onChange={(e) => {
                        setFileName(e.target.value)
                    }}></Input>
                </Modal>
            </>


            {/* 刷新时候如果有文件未保存，则提示 */}
            <>
                <Modal title={`警告`} open={isSaveAllFile} footer={[
                    <Button key="save" type="primary" onClick={() => {
                        saveAllFile();
                        closeDir(true); openDir(currentDirHandle);
                        setIsSaveAllFile(false)
                    }}>
                        保存
                    </Button>,
                    <Button key="noSave" type="primary" loading={loading} onClick={() => {
                        closeDir(true); openDir(currentDirHandle);
                        setIsSaveAllFile(false)
                    }}>
                        不保存
                    </Button>,
                    <Button
                        key="cancel"
                        onClick={() => { setIsSaveAllFile(false) }}
                    >
                        取消
                    </Button>,
                ]}  >
                    <span>有文件未保存，是否保存?</span>
                </Modal>
            </>
            {/* 侧栏 */}
            <div className={style.leftBar} id="leftBar" style={{ display: "flex", flexDirection: "column", width: `${leftBarWidth}px`, left: "5px" }} ref={leftBarDom}>
                <div style={{ width: "100%", height: "20px", display: "flex", justifyContent: "flex-end" }}>
                    <Button size="small" icon={<FileAddOutlined />} title="新建文件" alt="新增文件" onClick={(e) => {
                        confirmBox(e, 'file')
                    }} className={style.choice} />
                    <Button size="small" icon={<FolderAddOutlined />} title="新建文件夹" alt="新增文件夹" onClick={(e) => confirmBox(e, 'dir')} className={style.choice} />
                    <Button size="small" icon={<UndoOutlined />} style={{ marginTop: "0px" }} title="重载资源管理器" alt="刷新" className={style.choice} onClick={() => {
                        for (let i of Object.keys(state.openedFileContext)) {
                            if (state.openedFileContext[i].hasChange) {
                                setIsSaveAllFile(true);
                                return
                            }
                        }
                        closeDir(true); openDir(currentDirHandle);

                    }} />
                    <Button size="small" icon={<SwitcherOutlined />} title="折叠文件夹" alt="折疊文件夹" className={style.choice} onClick={() => folderAllFile()} />
                </div>
                <div data-path='/' style={{ display: "flex", transform: "translateY(5px)" }} className="dir-wrapper" >
                    {currentDirHandle ? (<div className={`${style.border}`} style={{ display: "flex", flexDirection: "column", width: `100%` }}>
                        <div className={style.dir} data-type='dir' style={{ width: "100%", display: "flex" }} ref={Refs.current["/"]} onClick={() => changeChosenBackgroundColorAndFoldState('/')}>
                            <span data-type='dir' style={{ width: "90%", display: "flex", flexDirection: "row", alignItems: "center", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                <img data-type='dir' src={foldState['/'] ? downArrow : rightArrow} alt="箭头" className={style.label} />
                                <DirImg type='dir'></DirImg>
                                {currentDirHandle.name}
                            </span>
                        </div>
                        <div className={`${style.border} ${style.heightTransition}`} style={{ width: "100%" }}>
                            <div >{createFileDom('/', showedFile, 1)}</div>
                        </div>
                    </div>) : (
                        !loading ? (
                            <div style={{ position: "absolute", display: "flex", flexDirection: "column", gap: state.config.gap, width: "100%", left: 0, right: 0, top: ((leftBarDom.current?.getBoundingClientRect().height ? leftBarDom.current?.getBoundingClientRect().height : 0) / 4), margin: "0 auto" }}>
                                <span style={{ width: "100%", textAlign: "center" }}>尚未打开文件夹</span>
                                <Button type="primary" onClick={() => openDir()} icon={<FolderOpenTwoTone twoToneColor="#ffffff" />}>打开文件夹</Button>
                            </div>
                        ) : null
                    )}
                </div>
                {/* 加载侧栏蒙层 */}
                {loading ? <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 2, }} className="mask">
                    <div style={{ background: "rgba(0,0,0,0.1)", position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} className="mask"></div>
                    <div style={{ position: "absolute", left: "0", right: "0", height: "max-content", width: "max-content", bottom: "0", top: "0", margin: "auto" }} className="mask">
                        <Spin tip="加载中..." size="large" >
                            <div className="content mask" ref={maskInnerDom} style={{ padding: "50px", background: "rgba(0, 0, 0, 0.1)" }} />
                        </Spin>
                    </div>

                </div> : null}

            </div>
            {/* 侧栏底部 */}
            <div style={{
                position: 'absolute', top: `${5 + leftBarDom.current?.getBoundingClientRect().height * 1}px`,
                left: `${0 + leftBarDom.current?.getBoundingClientRect().left * 1}px`, width: `${leftBarWidth - 4}px`, height: `40px`, display: "flex",
                justifyContent: "space-evenly"
            }}>

                {!isOpen ? (<Button onClick={() => openDir()} size="large" loading={loading}
                    icon={<FolderOpenTwoTone />}
                    className={`${style.button_hover} ${style.button_active}`}
                    style={{

                        background: "linear-gradient(145deg, #d9d2d2, #fff9f9)",
                        boxShadow: " 20px 20px 60px #cdc6c6,-20px -20px 60px #ffffff"
                    }}>

                </Button>) : (<Button onClick={() => closeDir(false)} size="large"
                    icon={<CloseDir />}
                    className={`${style.button_hover} ${style.button_active}`}
                    style={{
                        background: "linear-gradient(145deg, #d9d2d2, #fff9f9)",
                        boxShadow: " 20px 20px 60px #cdc6c6,-20px -20px 60px #ffffff"
                    }}>

                </Button>)}
                <Button icon={<SettingTwoTone />} className={`${style.button_hover} ${style.button_active}`} style={{
                    background: "linear-gradient(145deg, #d9d2d2, #fff9f9)",
                    boxShadow: " 20px 20px 60px #cdc6c6,-20px -20px 60px #ffffff"
                }} size="large" onClick={() => openSetting(!isShowSetting)} ref={settingButton}>
                </Button>
            </div>

            {/* 设置列表 */}
            {
                isShowSetting ? (
                    <div style={{
                        position: 'absolute', bottom: `${10 + topBarDom.current?.getBoundingClientRect().height * 1 - topBarDom.current?.getBoundingClientRect().height * 1}px`,
                        left: `${leftBarWidth + leftBarDom.current?.getBoundingClientRect().left * 1}px`, width: "max-content", height: `max-content`, zIndex: "1"
                    }} className={`animate__animated  animate__faster animate__bounce animate__zoomInLeft ${settingOutAnimate}`} ref={settingMenu}>
                        <ConfigCard>
                            <CheckBox id="1" value={state.config.autoSave} name="autoSave">文件失去焦点自动保存</CheckBox>
                            <CheckBox id="2" value={state.config.hasMaxOfLeftBarWidth} name="hasMaxOfLeftBarWidth">开启侧栏宽度限制</CheckBox>
                            <ConfigInput min="5" max="15" value={state.config.gap} name="gap">文件首行间隙</ConfigInput>
                        </ConfigCard>
                    </div>
                ) : null
            }

            {/* 顶栏 */}
            <div id="top-wrapper" className={`top-wrapper ${style.top_bar}`} ref={topBarDom} style={{
                position: "absolute", display: "flex", left: `${leftBarWidth + leftBarDom.current?.style.left.split("px")[0] * 1}px`,
                top: "0", fontSize: "14px", fontFamily: "Consolas, 'Courier New', monospace", height: `${topBar.length != 0 ? Math.ceil(topBar.length / Math.floor((viewWidth - leftBarDom.current?.getBoundingClientRect().width) / 140)) * 27 : 27}px`
                , width: `calc(100vw - ${leftBarWidth + leftBarDom.current?.style.left.split("px")[0] * 2}px)`, flexFlow: "wrap",
            }} onDoubleClick={() => { changeLeftBarState() }}>
                {

                    topBar.map((item) => {
                        return (
                            <div key={item.path + '/' + item.name} title={currentDirHandle.name + item.path + '/' + item.name}
                                className={`${style.filelabel} ${item.active ? style.active : null}  animate__animated animate__bounce  animate__fadeInBottomLeft animate__faster  `}
                                style={{ display: "flex", alignItems: "center", position: "relative", whiteSpace: "nowrap", height: "25px" }}
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
                position: "absolute", left: `${leftBarWidth + leftBarDom.current?.style.left.split("px")[0] * 1}px`, top: `${topBarDom.current?.getBoundingClientRect().height}px`,
                height: `calc(100vh - ${10 + topBarDom.current?.getBoundingClientRect().height}px)`, width: `calc(100vw - ${leftBarWidth + leftBarDom.current?.style.left.split("px")[0] * 2}px)`,
            }} >
                {children}
            </div>
        </div>
    )
}
