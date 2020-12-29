import { interpret, Machine, assign } from "xstate";


interface TSchema {
    states: {
        lot: {},
        part: {},
        quantity: {},
        saving: {},
        error: {},
        done: {}
    }
}
interface TContext {
    lotNo: string
    partNo: string
    quantity: number
    lotInfo: {
        bomQuantity: number
        shipQuantity: number
        receivedQuantity: number
    },
    error: string
}

type TEvents =
    | { type: 'INPUT', data: string | number }
    | { type: 'RESET' }
    | { type: 'SAVE' }


const test_data = {
    lotNo: 'BP0001',
    partNo: 'PT1',
}

// Guard to check if the glass is full
function valid_LotNo(context: TContext, event) {
    const valid = event.data === test_data.lotNo
    return valid
}

function valid_PartNo(context: TContext, event) {
    let valid = event.data === test_data.partNo
    return valid
}

function valid_Quantity(context: TContext, event) {
    return event.data >= 0
}

async function save(ctx: TContext) {
    await Promise.resolve('yyya')
    if (Math.random() > 0.2) {
        return Promise.resolve('saved')
    }
    return Promise.reject('error saving')
}

const clearData = assign({
    lotNo: "",
    partNo: "",
    quantity: 0,
    lotInfo: {
        bomQuantity: 0,
        shipQuantity: 0,
        receivedQuantity: 0
    },
    error: ''
})


const rcvMachine = Machine<TContext, TSchema, TEvents>(
    {
        id: 'receive-lot-part',
        // the initial context (extended state) of the statechart
        context: {
            lotNo: "",
            partNo: "",
            quantity: 0,
            lotInfo: {
                bomQuantity: 0,
                shipQuantity: 0,
                receivedQuantity: 0
            },
            error: ''
        },
        initial: 'lot',
        states: {
            lot: {
                on: {
                    INPUT: {
                        target: 'part',
                        cond: valid_LotNo,
                        actions: [assign({
                            lotNo: (ctx, evt) => evt.data as string
                        })]
                    }
                }
            },
            part: {
                on: {
                    INPUT: {
                        target: 'quantity',
                        cond: valid_PartNo,
                        actions: [assign({
                            partNo: (ctx, evt) => evt.data as string
                        })]

                    },
                    RESET: {
                        target: 'lot',
                        actions: [clearData]
                    }
                }
            },
            quantity: {
                on: {
                    INPUT: {
                        target: 'saving',
                        cond: valid_Quantity,
                        actions: [assign({
                            quantity: (ctx, evt) => evt.data as number
                        })]
                    },
                    RESET: {
                        target: 'lot',
                        actions: [clearData]
                    }
                }
            },
            saving: {
                invoke: {
                    id: 'save',
                    src: (ctx, e) => save(ctx),
                    onDone: {
                        target: 'done',
                        actions: [(ctx, evt) => {
                            console.log('done', evt)
                            return ctx
                        }]
                    },
                    onError: {
                        target: 'error',
                        actions: [assign({ error: 'something broke'})]
                    }
                }
            },
            error: {
                on: {
                    SAVE: 'saving'
                }
            },
            done: {
                type: 'final'
            }
        }
    }
);

const service = interpret(rcvMachine).onTransition(cur => {
    console.log(cur.value, cur.context.lotNo, cur.context.partNo, cur.context.quantity)
    console.log('---')
}).start()

service.send('INPUT', { data: 'BP0001' })
service.send('INPUT', { data: 'PT1' })
service.send('INPUT', { data: 5 })
service.send('SAVE')
