import server from './index'

server()

server({
    http: {
        port: 3000
    }
})