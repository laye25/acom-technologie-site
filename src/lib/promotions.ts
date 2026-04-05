import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Service } from '../types';

export const isPromotionActive = (service: Service | null | undefined): boolean => {
  if (!service?.promotion || !service.promotion.isActive) return false;
  if (!service.promotion.startDate || !service.promotion.endDate) return false;

  try {
    const now = new Date();
    const start = startOfDay(parseISO(service.promotion.startDate));
    const end = endOfDay(parseISO(service.promotion.endDate));

    return isWithinInterval(now, { start, end });
  } catch (error) {
    console.error("Error checking promotion activity:", error);
    return false;
  }
};

export const getDiscountedPrice = (price: number, discountPercentage: number): number => {
  return price * (1 - discountPercentage / 100);
};

export const getServicePrice = (service: Service): number => {
  if (isPromotionActive(service)) {
    return getDiscountedPrice(service.price, service.promotion!.discountPercentage);
  }
  return service.price;
};

export const getOrderDiscountedTotal = (order: any, service?: Service | null): number => {
  // If service is provided, check if promotion is active in the service configuration
  // If not provided, fallback to the discount stored in the order
  const promoActive = service ? isPromotionActive(service) : true;
  const discount = promoActive ? (order.discountPercentage || 0) : 0;
  const couponDiscount = order.couponDiscount || 0;
  
  const discountedTotal = (order.totalPrice || 0) * (1 - discount / 100);
  return Math.max(0, discountedTotal - couponDiscount);
};
