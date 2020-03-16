#!/bin/bash
mongo admin --eval "db.getSiblingDB('countries').createUs er({user: 'student', pwd: '12345', roles: ['readWrite']})"
