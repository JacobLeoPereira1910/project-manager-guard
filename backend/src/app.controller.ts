import {
  Controller,
  Post,
  Body,
  BadRequestException,
  InternalServerErrorException,
  Get,
  Patch,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Delete,
  Query,
} from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { JwtUtils } from './utils/jwt.utils';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import * as bcrypt from 'bcrypt';
import { Contacts } from './types/contacts';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('app')
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtUtils: JwtUtils,
  ) {}

  @Get('contact')
  async findContact(@Query() query: { id: string }) {
    const { id } = query;

    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      throw new BadRequestException('ID inválido');
    }

    const contact = await this.prisma.contact.findUnique({
      where: { id: numericId },
    });

    if (!contact) {
      throw new BadRequestException('Contato não encontrado');
    }

    return contact;
  }

  @Post('user')
  async createUser(
    @Body() body: { name: string; email: string; password: string },
  ) {
    const { name, email, password } = body;

    if (!name || !email || !password) {
      throw new BadRequestException('Nome, email e senha são obrigatórios');
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      return { id: user.id, name: user.name, email: user.email }; 
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw new InternalServerErrorException('Erro ao criar usuário');
    }
  }

  @Post('login')
  async loginUser(@Body() body: { email: string; password: string }) {
    const { email, password } = body;

    if (!email || !password) {
      throw new BadRequestException('Email e senha são obrigatórios');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Senha incorreta');
    }

    const token = this.jwtUtils.generateToken({
      sub: user.id,
      email: user.email,
    });

    return { access_token: token };
  }

  @UseGuards(JwtAuthGuard)
  @Post('contacts')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.random().toString(36).substring(2, 15);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async createContact(
    @Body() body: { name: string; email: string; telephone: string },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Contacts> {
    const { name, email, telephone } = body;

    if (!name || !email || !telephone || !file) {
      throw new BadRequestException(
        'Nome, email, telefone e imagem são obrigatórios',
      );
    }

    try {
      const contact = await this.prisma.contact.create({
        data: {
          name,
          email,
          telephone,
          image: file.path,
        },
      });

      return contact;
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      throw new InternalServerErrorException('Erro ao criar contato');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('contacts')
  async getContacts(): Promise<Contacts[]> {
    try {
      return await this.prisma.contact.findMany();
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      throw new InternalServerErrorException('Erro ao buscar contatos');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('contacts/:id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.random().toString(36).substring(2, 15);
          cb(null, uniqueSuffix + extname(file.originalname)); 
        },
      }),
    }),
  )
  async updateContact(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; telephone?: string },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Contacts> {
    const { name, email, telephone } = body;

    if (!file && !name && !email && !telephone) {
      throw new BadRequestException(
        'Pelo menos um campo (nome, email ou telefone) deve ser fornecido',
      );
    }

    try {
      const contactData: any = {
        ...(name && { name }),
        ...(email && { email }),
        ...(telephone && { telephone }),
      };

      if (file) {
        contactData.image = file.path;
      }

      const contact = await this.prisma.contact.update({
        where: { id: Number(id) },
        data: contactData,
      });

      return contact;
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      throw new InternalServerErrorException('Erro ao atualizar contato');
    }
  }
  @UseGuards(JwtAuthGuard)
  @Delete('contacts/:id')
  async deleteContact(@Param('id') id: string): Promise<{ message: string }> {
    try {
      const contact = await this.prisma.contact.delete({
        where: { id: Number(id) },
      });
      return { message: 'Contato excluído com sucesso' };
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      throw new InternalServerErrorException('Erro ao excluir contato');
    }
  }
}
