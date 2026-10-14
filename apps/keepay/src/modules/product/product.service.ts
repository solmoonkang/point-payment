import { ErrorCode } from '../../utils/error-code.js'
import { AppError } from '../../utils/error.js'
import type { ProductRepository } from './product.repository.js'
import type { Gym, Plan, Product } from './product.type.js'

export interface ProductService {
  list(): Product[]
  get(productId: string): Product
  plan(productId: string, planId: string): { product: Product; plan: Plan } // 결제 금액은 이 값으로만 계산
  searchGyms(query: string): Gym[]
  gym(gymId: string): Gym
}

export function createProductService(dependencies: { products: ProductRepository }): ProductService {
  const { products } = dependencies

  return {
    list: () => products.products(),

    get: (productId) => getProduct(productId),

    plan(productId, planId) {
      const product = getProduct(productId)
      return { product, plan: getPlan(product, planId) }
    },

    searchGyms(query) {
      const keyword = query.trim()
      return products.gyms().filter((gym) => !keyword || gym.name.includes(keyword) || gym.address.includes(keyword))
    },

    gym(gymId) {
      const gym = products.gyms().find((item) => item.id === gymId)
      if (!gym) throw new AppError(ErrorCode.GYM_NOT_FOUND)
      return gym
    },
  }

  function getProduct(productId: string): Product {
    const product = products.products().find((item) => item.id === productId)
    if (!product) throw new AppError(ErrorCode.PRODUCT_NOT_FOUND)
    return product
  }

  function getPlan(product: Product, planId: string): Plan {
    const plan = product.plans.find((item) => item.id === planId)
    if (!plan) throw new AppError(ErrorCode.PLAN_NOT_FOUND)
    return plan
  }
}
