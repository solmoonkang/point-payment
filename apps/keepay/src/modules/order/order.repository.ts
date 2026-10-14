import type { Order } from './order.type.js'

export interface OrderRepository {
  insert(order: Omit<Order, 'id'>): Order // 1 부터 번호를 매김
  update(id: number, patch: Partial<Order>): Order
  findById(id: number): Order | undefined
  findByRequestId(requestId: string): Order | undefined
  list(): Order[] // 최신 순
}

export function createMemoryOrderRepository(): OrderRepository {
  // ponytail: 메모리 보관이라 서버를 다시 켜면 비워짐, 오래 남겨야 하면 파일 · DB 로
  const orders = new Map<number, Order>()
  let seq = 0

  return {
    insert(order) {
      const saved: Order = { ...order, id: ++seq }
      orders.set(saved.id, saved)
      return { ...saved }
    },
    update(id, patch) {
      const current = orders.get(id)
      if (!current) throw new Error(`주문 ${id} 없음`)
      const updated = { ...current, ...patch, id }
      orders.set(id, updated)
      return { ...updated }
    },
    findById: (id) => {
      const order = orders.get(id)
      return order && { ...order }
    },
    findByRequestId: (requestId) => {
      const order = [...orders.values()].find((item) => item.requestId === requestId)
      return order && { ...order }
    },
    list: () => [...orders.values()].reverse().map((order) => ({ ...order })),
  }
}
