<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\View\View;

class ProfileController extends Controller
{
    // Muestra el formulario donde el usuario puede editar su perfil
    public function edit(Request $request): View
    {
        return view('profile.edit', [
            'user' => $request->user(),
        ]);
    }

    // Procesa y guarda la nueva información del perfil del usuario
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        // Guardamos el usuario actual en una variable para no tener que buscarlo múltiples veces
        $user = $request->user();

        // Llenamos el modelo con los datos validados del formulario (nombre, email, etc.)
        $user->fill($request->validated());

        // Si el usuario cambió su correo electrónico, debemos invalidar su verificación actual
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        // Guardamos los cambios en la base de datos
        $user->save();

        // Redirigimos de vuelta a la página de edición con un mensaje de éxito
        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    // Elimina permanentemente la cuenta del usuario y todos sus datos
    public function destroy(Request $request): RedirectResponse
    {
        // Exigimos que el usuario confirme su contraseña actual por seguridad antes de borrar
        $request->validateWithBag('userDeletion', [
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        // Cerramos la sesión del usuario
        Auth::logout();

        // Borramos el registro del usuario de la base de datos
        $user->delete();

        // Invalidamos la sesión actual y regeneramos el token CSRF para evitar ataques de seguridad
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Redirigimos a la página principal
        return Redirect::to('/');
    }
}
