﻿import axios from "axios";
import prismaClient from "../prisma";
import { sign } from "jsonwebtoken";
import "dotenv/config";
import "dotenv";

interface IAcessTokenResponse {
  access_token: string;
}

interface IUserResponse {
  avatar_url: string;
  login: string;
  id: number;
  name: string;
}

class AuthenticateUserService {
  async execute(code: string) {
    const url = "https://github.com/login/oauth/access_token";

    const { data: accessTokenResponse } = await axios.post<IAcessTokenResponse>(
      url,
      null,
      {
        params: {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        headers: {
          Accept: "application/json",
        },
      }
    );

    const response = await axios.get<IUserResponse>(
      "https://api.github.com/user",
      {
        headers: {
          authorization: `Bearer ${accessTokenResponse.access_token}`,
        },
      }
    );

    const { login, id, avatar_url, name } = response.data;

    let user = await prismaClient.user.findFirst({
      where: {
        github_id: id,
      },
    });

    if (!user) {
      user = await prismaClient.user.create({
        data: {
          github_id: id,
          login,
          avatar_url,
          name,
        },
      });
    }

    //const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";
    //console.log(JWT_SECRET);

    console.log(process.env.JWT_SECRET);

    const token = sign(
      {
        user: {
          name: user.name,
          avatar_ur: user.avatar_url,
          id: user.id,
        },
      },

      process.env.JWT_SECRET,

      {
        subject: user.id,
        expiresIn: "1d",
      }
    );

    //return response.data;
    return { token, user };
  }
}

export { AuthenticateUserService };
