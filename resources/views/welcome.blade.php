<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ajedrez Online</title>

    @vite(['resources/css/app.css'])

    <style>
        *{
            margin:0;
            padding:0;
            box-sizing:border-box;
        }

        body{
            font-family: Arial, Helvetica, sans-serif;
            background: linear-gradient(135deg, #0f172a, #1e293b);
            color:white;
            min-height:100vh;
            display:flex;
            justify-content:center;
            align-items:center;
        }

        .container{
            text-align:center;
            background:#111827;
            padding:50px;
            border-radius:20px;
            width:420px;
            box-shadow:0 0 25px rgba(0,0,0,0.5);
        }

        h1{
            font-size:50px;
            margin-bottom:15px;
        }

        p{
            color:#cbd5e1;
            margin-bottom:35px;
            line-height:1.6;
        }

        .buttons{
            display:flex;
            flex-direction:column;
            gap:15px;
        }

        .btn{
            text-decoration:none;
            padding:15px;
            border-radius:10px;
            font-size:18px;
            transition:0.3s;
            font-weight:bold;
        }

        .play{
            background:#22c55e;
            color:white;
        }

        .play:hover{
            background:#16a34a;
        }

        .login{
            background:#3b82f6;
            color:white;
        }

        .login:hover{
            background:#2563eb;
        }

        .register{
            background:#f59e0b;
            color:white;
        }

        .register:hover{
            background:#d97706;
        }
    </style>
</head>
<body>

<div class="container">

    <h1>♟ AJEDREZ</h1>

    <p>
        Juego de ajedrez online desarrollado con Laravel,
        JavaScript y MySQL.
    </p>

    <div class="buttons">

        @auth
            <a href="{{ route('chess.lobby') }}" class="btn play">
                Entrar al Juego
            </a>
        @else
            <a href="{{ route('login') }}" class="btn login">
                Iniciar Sesión
            </a>

            <a href="{{ route('register') }}" class="btn register">
                Registrarse
            </a>
        @endauth

    </div>

</div>

</body>
</html>