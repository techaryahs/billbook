import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "./session";

export async function getCurrentUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businesses: {
        include: {
          business: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  // Find the first business membership, if any
  const membership = user.businesses[0] || null;
  const business = membership?.business || null;
  const role = membership?.role || null;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
    },
    business: business
      ? {
          id: business.id,
          name: business.name,
          legalName: business.legalName,
          gstin: business.gstin,
          phone: business.phone,
          email: business.email,
          address: business.address,
          city: business.city,
          state: business.state,
          pincode: business.pincode,
          country: business.country,
          currency: business.currency,
          timezone: business.timezone,
          role: role,
        }
      : null,
  };
}
