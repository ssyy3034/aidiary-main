package org.aidiary.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String IMAGE_QUEUE = "image-processing";
    public static final String IMAGE_EXCHANGE = "image-exchange";
    public static final String IMAGE_ROUTING_KEY = "image.analyze";

    // DLQ (Dead Letter Queue) — 실패한 메시지를 별도 보관
    public static final String IMAGE_DLQ = "image-processing.dlq";
    public static final String IMAGE_DLX = "image-exchange.dlx";

    @Bean
    public Queue imageQueue() {
        return QueueBuilder.durable(IMAGE_QUEUE)
                .withArgument("x-dead-letter-exchange", IMAGE_DLX)
                .withArgument("x-dead-letter-routing-key", IMAGE_DLQ)
                .build();
    }

    @Bean
    public DirectExchange imageExchange() {
        return new DirectExchange(IMAGE_EXCHANGE);
    }

    @Bean
    public Binding imageBinding(Queue imageQueue, DirectExchange imageExchange) {
        return BindingBuilder.bind(imageQueue).to(imageExchange).with(IMAGE_ROUTING_KEY);
    }

    // Dead Letter Queue 설정
    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(IMAGE_DLQ).build();
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(IMAGE_DLX);
    }

    @Bean
    public Binding deadLetterBinding(Queue deadLetterQueue, DirectExchange deadLetterExchange) {
        return BindingBuilder.bind(deadLetterQueue).to(deadLetterExchange).with(IMAGE_DLQ);
    }

    // JSON 직렬화
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }

    // Queue 크기를 런타임에 조회하기 위한 RabbitAdmin
    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        return new RabbitAdmin(connectionFactory);
    }
}
