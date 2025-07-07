import { prisma } from '@/databases';
import { userLoginDTO, userNonceDTO } from '@/validators/user.schema';
import { verifyMessage, getAddress } from 'viem';
import { DateTime } from 'luxon';

// Create deterministic JSON string with sorted keys
const createDeterministicMessage = (data: any): string => {
  const sortedData = Object.keys(data)
    .sort()
    .reduce((result: any, key) => {
      result[key] = data[key];
      return result;
    }, {});

  return JSON.stringify(sortedData);
};

export const handleUserSignin = async ({
  body,
  jwt,
  cookie: { access, refresh },
}: {
  body: typeof userLoginDTO.body;
  jwt: any;
  cookie: { access: any; refresh: any };
}) => {
  const { signature, data } = body;
  const { address, nonce: messageNonce, timestamp } = data;

  const now = DateTime.now();
  const messageTimestamp = DateTime.fromMillis(timestamp);

  if (now.diff(messageTimestamp, 'milliseconds').toMillis() > 5 * 60 * 1000) {
    throw new Error('Timestamp expired');
  }

  try {
    const message = createDeterministicMessage(data);
    console.log(message);

    const isValid = await verifyMessage({
      address: getAddress(address),
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) throw new Error('Invalid signature');

    let user = await prisma.user.findUnique({
      where: { address: getAddress(address) },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          address: getAddress(address),
          name: `User ${getAddress(address).slice(0, 6)}...${getAddress(address).slice(-4)}`,
          nonce: 1,
        },
      });
    } else {
      if (messageNonce !== user.nonce) {
        throw new Error('Invalid nonce');
      }

      await prisma.user.update({
        where: { address: getAddress(address) },
        data: { nonce: { increment: 1 } },
      });
    }

    const accessToken = await jwt.sign(
      {
        address: user.address,
        name: user.name,
        role: user.role,
        type: 'access',
      },
      { expiresIn: '15m' },
    );
    const refreshToken = await jwt.sign(
      {
        address: user.address,
        name: user.name,
        role: user.role,
        type: 'refresh',
      },
      { expiresIn: '7d' },
    );

    access.set({
      value: accessToken,
      httpOnly: true,
      maxAge: 15 * 60,
      path: '/',
    });

    refresh.set({
      value: refreshToken,
      httpOnly: true,
      maxAge: 7 * 86400,
      path: '/',
    });

    return {
      message: `Welcome ${user.name}!`,
      user: {
        address: user.address,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getUserById = async (address: string) => {
  const user = await prisma.user.findUnique({
    where: { address },
    select: {
      address: true,
      name: true,
      nonce: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw null;
  }

  return user;
};

export const getUserNonce = async (dto: typeof userNonceDTO) => {
  const { address } = dto.params;

  try {
    const normalizedAddress = getAddress(address);

    const user = await prisma.user.findUnique({
      where: { address: normalizedAddress },
      select: {
        nonce: true,
      },
    });

    return {
      data: user ? user.nonce : 0,
    };
  } catch (error) {
    throw new Error('Invalid address format');
  }
};
