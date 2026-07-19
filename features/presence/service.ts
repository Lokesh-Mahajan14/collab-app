import { db } from "@/lib/db";

export async function setUserOnline(
    userId:string
) {
    return db.user.update({
        where:{
            id:userId
        },
        data:{
            status:"ONLINE"
        }
    })
    
}

export async function setUserOffline(
  userId: string
) {
  return db.user.update({
    where: { id: userId },

    data: {
      status: "OFFLINE",

      lastSeen: new Date(),
    },
  });
}

