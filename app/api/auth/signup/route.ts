import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = signupSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021") {
        return NextResponse.json(
          {
            message:
              "Database schema is not initialized. Run `npx prisma db push` and retry.",
          },
          { status: 500 }
        );
      }
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          message:
            "Unable to connect to the database right now. Please retry in a few seconds.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
