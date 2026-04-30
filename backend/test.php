<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");

echo json_encode(["status" => "ok"]);