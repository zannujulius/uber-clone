process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_NAME = process.env.DB_NAME || 'ride_hailing_db';
process.env.DB_USER = process.env.DB_USER || 'zannujulius';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.KAFKA_BROKERS = process.env.KAFKA_BROKERS || 'localhost:9092';
process.env.KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'fare-estimation-test';
process.env.KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || 'fare-estimation-test-group';
process.env.KAFKA_ESTIMATE_REQUEST_TOPIC =
  process.env.KAFKA_ESTIMATE_REQUEST_TOPIC || 'rider.trip.estimate.requested';
process.env.KAFKA_TRIP_REQUEST_TOPIC =
  process.env.KAFKA_TRIP_REQUEST_TOPIC || 'rider.trip.requested';
process.env.KAFKA_NOTIFICATION_TOPIC =
  process.env.KAFKA_NOTIFICATION_TOPIC || 'rider.notifications';
