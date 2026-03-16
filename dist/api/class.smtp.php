<?php

class SMTPMailer {
    private $host;
    private $port;
    private $username;
    private $password;
    private $debug = false;

    public function __construct($host, $port, $username, $password) {
        $this->host = $host;
        $this->port = $port;
        $this->username = $username;
        $this->password = $password;
    }

    public function send($to, $subject, $body, $fromName = 'Krugerr Brendt') {
        $socket = fsockopen("ssl://{$this->host}", $this->port, $errno, $errstr, 30);
        if (!$socket) {
            return "Connection failed: $errstr ($errno)";
        }

        $this->read($socket); // Welcome message

        $this->cmd($socket, "EHLO " . $this->host);
        $this->cmd($socket, "AUTH LOGIN");
        $this->cmd($socket, base64_encode($this->username));
        $this->cmd($socket, base64_encode($this->password));

        $this->cmd($socket, "MAIL FROM: <{$this->username}>");
        $this->cmd($socket, "RCPT TO: <$to>");
        $this->cmd($socket, "DATA");

        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: $fromName <{$this->username}>\r\n";
        $headers .= "To: $to\r\n";
        $headers .= "Subject: $subject\r\n";
        
        $message = "$headers\r\n$body\r\n.\r\n";
        
        $this->cmd($socket, $message);
        $this->cmd($socket, "QUIT");

        fclose($socket);
        return true;
    }

    private function cmd($socket, $cmd) {
        fputs($socket, $cmd . "\r\n");
        return $this->read($socket);
    }

    private function read($socket) {
        $response = "";
        while ($str = fgets($socket, 515)) {
            $response .= $str;
            if (substr($str, 3, 1) == " ") break;
        }
        if ($this->debug) echo $response . "<br>";
        return $response;
    }
}
?>
