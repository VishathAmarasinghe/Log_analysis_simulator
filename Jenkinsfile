pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'log-simulator'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo 'Checking out code from GitHub...'
                    git branch: 'main',
                        credentialsId: 'GITHUB_VISHATH_CREDENTIALS',
                        url: 'https://github.com/VishathAmarasinghe/Log_analysis_simulator.git'
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    echo 'Installing Node.js dependencies...'
                    sh '''
                        if [ -f "package-lock.json" ]; then
                            npm ci
                        else
                            npm install
                        fi
                    '''
                }
            }
        }
        stage('Build TypeScript') {
            steps {
                script {
                    echo 'Compiling TypeScript to JavaScript...'
                    sh 'npm run build'
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image: ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    sh """
                        docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
                        docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }
        
        stage('Deploy with Docker Compose') {
            steps {
                script {
                    echo 'Deploying application with Docker Compose...'
                    sh """
                        # Stop and remove only log simulator containers (won't affect other apps)
                        docker-compose -p log-simulator down || true
                        
                        # Start new containers with explicit project name
                        docker-compose -p log-simulator up -d
                        
                        # Wait for services to be healthy
                        sleep 15
                        
                        # Check if services are running
                        docker-compose -p log-simulator ps
                    """
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo 'Running health checks...'
                    sh """
                        # Wait for API to be ready
                        for i in {1..30}; do
                            if curl -f http://localhost:4000/health; then
                                echo "Health check passed"
                                break
                            fi
                            echo "Waiting for service to be ready... (\$i/30)"
                            sleep 2
                        done
                        
                        # Check service status
                        curl -f http://localhost:4000/api/status || exit 1
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
            echo "Docker image: ${DOCKER_IMAGE}:${DOCKER_TAG}"
            sh 'docker-compose -p log-simulator ps'
        }
        
        failure {
            echo 'Pipeline failed!'
            sh 'docker-compose -p log-simulator logs --tail=50 || true'
        }
        
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
    }
}

