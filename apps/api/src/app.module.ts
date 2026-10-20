import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProductsModule } from './modules/products/products.module';
import { UsersModule } from './modules/users/users.module';
import { VerificationModule } from './modules/verification/verification.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { FacilitiesModule } from './modules/facilities/facilities.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { LabsModule } from './modules/labs/labs.module';
import { BloodModule } from './modules/blood/blood.module';
import { ContactModule } from './modules/contact/contact.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Default: 100 requests per minute per IP. Sensitive routes override this with @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    VerificationModule,
    PaymentsModule,
    ProductsModule,
    OrdersModule,
    AssistantModule,
    FacilitiesModule,
    DoctorsModule,
    AppointmentsModule,
    AvailabilityModule,
    LabsModule,
    BloodModule,
    ContactModule,
    PharmacyModule,
    HealthModule,
    ReviewsModule,
    AddressesModule,
    WalletModule,
    PrescriptionsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
