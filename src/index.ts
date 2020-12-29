import { interpret, Machine, assign } from "xstate";

interface TContext {
    lotNo: string
    partNo: string
    quantity: number
    lotInfo: {
        bomQuantity: number
        shipQuantity: number
        receivedQuantity: number
    }

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
    let valid =  event.data === test_data.partNo
    return valid
}

function valid_Quantity(context: TContext, event) {
    return event.data >= 0
}

const clearData = assign({
    lotNo: "",
    partNo: "",
    quantity: 0,
    lotInfo: {
        bomQuantity: 0,
        shipQuantity: 0,
        receivedQuantity: 0
    }
})


const rcvMachine = Machine<TContext, any, TEvents>(
    {
        id: 'glass',
        // the initial context (extended state) of the statechart
        context: {
            lotNo: "",
            partNo: "",
            quantity: 0,
            lotInfo: {
                bomQuantity: 0,
                shipQuantity: 0,
                receivedQuantity: 0
            }
        },
        initial: 'idle',
        states: {
            idle: {
                on: {
                    INPUT: {
                        target: 'lotNo',
                        cond: valid_LotNo,
                        actions: [assign({
                            lotNo: (ctx, evt) => evt.data as string
                        })]
                    }
                }
            },
            lotNo: {
                on: {
                    INPUT: {
                        target: 'partNo',
                        cond: valid_PartNo,
                        actions: [assign({
                            partNo: (ctx, evt) => evt.data as string
                        })]

                    },
                    RESET: {
                        target: 'idle',
                        actions: [clearData]
                    }
                }
            },
            partNo: {
                on: {
                    INPUT: {
                        target: 'partNo',
                        cond: valid_Quantity,
                        actions: [assign({
                            quantity: (ctx, evt) => evt.data as number
                        })]
                    },
                    RESET: {
                        target: 'idle',
                        actions: [clearData]
                    }
                }
            },
            quantity: {
                on: {
                    SAVE: {

                    },
                    RESET: {
                        target: 'idle',
                        actions: [clearData]
                    }

                }
            }
        }
    }, {

},
);

const service = interpret(rcvMachine).onTransition(cur => {
    console.log(cur.value, cur.context.lotNo, cur.context.partNo, cur.context.quantity)
    console.log('---')
}).start()

service.send('INPUT', { data: 'BP0001' })
service.send('INPUT', { data: 'PT1' })
service.send('INPUT', { data: 5 })
service.send('RESET')
