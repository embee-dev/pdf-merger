export const messageTypes = {
    info: 'info',
    error: 'error'
}
export function printMessage(type = '', parameters = {}) {
    if (type === messageTypes.info) {
        console.info(parameters)
    }

    if (type === messageTypes.error) {
        console.error(parameters)
    }
}
